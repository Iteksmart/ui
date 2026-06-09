"""Layer 2 — THINK. Cyclical retry loop + specialist agent routing.

Closes Gap 2A (LangGraph-style cycles for AG2: failed execution returns to
planning with full failure context, bounded by max_cycles, escalating to the
HumanArbiter at the limit) and Gap 2B (domain specialist routing).

Fill-gaps beyond the spec: a global kill switch and a dry-run mode — both
required before anything is allowed to retry actions autonomously.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

# ── Cyclical incident-resolution loop (Gap 2A) ───────────────────────


@dataclass
class Plan:
    description: str
    cycle: int
    context: dict[str, Any] = field(default_factory=dict)


@dataclass
class ExecutionResult:
    success: bool
    detail: str = ""
    blast_radius_update: int | None = None


@dataclass
class LoopOutcome:
    resolved: bool
    cycles_used: int
    escalated: bool
    history: list[dict[str, Any]] = field(default_factory=list)


class KillSwitchEngaged(RuntimeError):
    """Raised when the global autonomy kill switch is on."""


class CyclicalLoop:
    """Plan → gate → execute, cycling on failure with accumulated context.

    planner(context)   -> Plan          (RemediationPlanner)
    gatekeeper(plan)   -> bool          (SecurityGatekeeper + policy engine)
    executor(plan)     -> ExecutionResult (ExecutionAgent)
    seal(category, data)                (ProofLinkNotary hook, per cycle)
    escalate(history)                   (HumanArbiter page at max_cycles)
    """

    def __init__(
        self,
        planner: Callable[[dict[str, Any]], Plan],
        gatekeeper: Callable[[Plan], bool],
        executor: Callable[[Plan], ExecutionResult],
        seal: Callable[[str, dict[str, Any]], None] = lambda category, data: None,
        escalate: Callable[[list[dict[str, Any]]], None] = lambda history: None,
        max_cycles: int = 3,
        kill_switch: Callable[[], bool] = lambda: False,
        dry_run: bool = False,
    ):
        self.planner = planner
        self.gatekeeper = gatekeeper
        self.executor = executor
        self.seal = seal
        self.escalate = escalate
        self.max_cycles = max_cycles
        self.kill_switch = kill_switch
        self.dry_run = dry_run

    def run(self, incident_context: dict[str, Any]) -> LoopOutcome:
        if self.kill_switch():
            raise KillSwitchEngaged("autonomy kill switch is engaged — no automated remediation")

        history: list[dict[str, Any]] = []
        context = dict(incident_context)

        for cycle in range(1, self.max_cycles + 1):
            plan = self.planner({**context, "cycle": cycle, "history": list(history)})
            plan.cycle = cycle

            if not self.gatekeeper(plan):
                entry = {"cycle": cycle, "plan": plan.description, "result": "blocked_by_gatekeeper"}
                history.append(entry)
                self.seal(f"incident_cycle_{cycle}", entry)
                self.escalate(history)
                return LoopOutcome(resolved=False, cycles_used=cycle, escalated=True, history=history)

            if self.dry_run:
                entry = {"cycle": cycle, "plan": plan.description, "result": "dry_run_only"}
                history.append(entry)
                self.seal(f"incident_cycle_{cycle}", entry)
                return LoopOutcome(resolved=False, cycles_used=cycle, escalated=False, history=history)

            result = self.executor(plan)
            entry = {
                "cycle": cycle,
                "plan": plan.description,
                "result": "success" if result.success else "execution_failed",
                "detail": result.detail,
            }
            history.append(entry)
            self.seal(f"incident_cycle_{cycle}", entry)

            if result.success:
                return LoopOutcome(resolved=True, cycles_used=cycle, escalated=False, history=history)

            # feed failure context into the next planning cycle
            context["previous_failure"] = {
                "plan": plan.description,
                "failure_reason": result.detail,
                "blast_radius_update": result.blast_radius_update,
            }

        self.escalate(history)
        return LoopOutcome(resolved=False, cycles_used=self.max_cycles, escalated=True, history=history)


# ── Specialist agent routing (Gap 2B) ────────────────────────────────

SPECIALISTS: list[dict[str, Any]] = [
    {"agent": "DatabaseAgent", "model": "nemotron", "keywords": ("postgres", "query", "connection pool", "deadlock", "core_db", "slow query")},
    {"agent": "SecurityAgent", "model": "claude", "keywords": ("wazuh", "cve", "intrusion", "auth failure", "brute force", "malware")},
    {"agent": "NetworkAgent", "model": "nemotron", "keywords": ("dns", "latency", "certificate", "tls", "timeout", "502", "tunnel")},
    {"agent": "CostAgent", "model": "nemotron", "keywords": ("rightsizing", "cost", "utilization", "idle")},
    {"agent": "ComplianceAgent", "model": "claude", "keywords": ("hipaa", "policy violation", "audit gap", "retention", "nist")},
]

DEFAULT_SPECIALIST = {"agent": "GeneralistAgent", "model": "claude"}


def route_incident(description: str) -> dict[str, str]:
    """Pick the specialist sub-agent (and model) for an incident description."""
    text = description.lower()
    best, best_hits = DEFAULT_SPECIALIST, 0
    for spec in SPECIALISTS:
        hits = sum(1 for k in spec["keywords"] if k in text)
        if hits > best_hits:
            best, best_hits = spec, hits
    return {"agent": best["agent"], "model": best["model"]}

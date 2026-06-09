"""Layer 5 — LEARN. Outcome feedback loop, cross-incident correlation, and
the weekly intelligence report.

Closes Gaps 5A/5B/5C — the hive mind. Every resolution is stored with its
outcome; the next similar incident starts with the fix already in context.
Failed remediations are stored as negative examples so the planner is told
what NOT to try. Clusters of similar incidents are flagged as systemic.
"""

from __future__ import annotations

import statistics
import time
from dataclasses import dataclass, field
from typing import Any

from .sense import InMemoryVectorStore

SUCCESS = "success"
PARTIAL = "partial_success"
FAILURE = "failure"
ROLLBACK = "rollback"


@dataclass
class IncidentOutcome:
    incident_id: str
    pattern_text: str
    remediation: str
    classification: str  # success | partial_success | failure | rollback
    mttr_minutes: float
    blast_radius_actual: int = 0
    receipt_ids: list[str] = field(default_factory=list)
    tenant: str | None = None
    at: float = field(default_factory=time.time)


@dataclass
class Suggestion:
    remediation: str
    confidence: float
    expected_mttr_minutes: float
    source_incident: str
    avoid: list[str] = field(default_factory=list)  # known-bad remediations


class FeedbackLoop:
    """Gap 5A — outcomes feed the memory; memory feeds the next incident."""

    def __init__(self, store: InMemoryVectorStore | None = None, match_threshold: float = 0.80):
        self.store = store or InMemoryVectorStore()
        self.match_threshold = match_threshold
        self.outcomes: list[IncidentOutcome] = []

    def record(self, outcome: IncidentOutcome) -> None:
        self.outcomes.append(outcome)
        self.store.upsert(
            outcome.incident_id,
            outcome.pattern_text,
            metadata={
                "remediation": outcome.remediation,
                "classification": outcome.classification,
                "mttr_minutes": outcome.mttr_minutes,
                "blast_radius_actual": outcome.blast_radius_actual,
                "receipt_ids": outcome.receipt_ids,
                "tenant": outcome.tenant,
            },
        )

    def suggest(self, pattern_text: str) -> Suggestion | None:
        """Return the best known-good fix for a pattern, with known-bad plans to avoid."""
        hits = self.store.search(pattern_text, top_k=5)
        best: Suggestion | None = None
        avoid: list[str] = []
        for score, item in hits:
            if score < self.match_threshold:
                continue
            meta = item.metadata
            if meta.get("classification") in (FAILURE, ROLLBACK):
                avoid.append(meta.get("remediation", ""))
            elif best is None:
                best = Suggestion(
                    remediation=meta.get("remediation", ""),
                    confidence=score,
                    expected_mttr_minutes=float(meta.get("mttr_minutes", 0.0)),
                    source_incident=item.id,
                )
        if best:
            best.avoid = [a for a in avoid if a]
        return best


@dataclass
class Cluster:
    incident_ids: list[str]
    representative: str
    systemic: bool
    tenants: list[str]


class CorrelationEngine:
    """Gap 5B — N similar incidents in a window are one systemic issue."""

    def __init__(self, similarity_threshold: float = 0.85, systemic_count: int = 3):
        self.similarity_threshold = similarity_threshold
        self.systemic_count = systemic_count

    def correlate(self, outcomes: list[IncidentOutcome]) -> list[Cluster]:
        store = InMemoryVectorStore()
        for o in outcomes:
            store.upsert(o.incident_id, o.pattern_text, {"tenant": o.tenant})

        assigned: set[str] = set()
        clusters: list[Cluster] = []
        for o in outcomes:
            if o.incident_id in assigned:
                continue
            members = [o.incident_id]
            tenants = {o.tenant} if o.tenant else set()
            for score, item in store.search(o.pattern_text, top_k=len(outcomes)):
                if item.id == o.incident_id or item.id in assigned:
                    continue
                if score >= self.similarity_threshold:
                    members.append(item.id)
                    if item.metadata.get("tenant"):
                        tenants.add(item.metadata["tenant"])
            assigned.update(members)
            clusters.append(
                Cluster(
                    incident_ids=members,
                    representative=o.pattern_text,
                    systemic=len(members) >= self.systemic_count,
                    tenants=sorted(t for t in tenants if t),
                )
            )
        return clusters


def intelligence_report(
    this_week: list[IncidentOutcome],
    last_week: list[IncidentOutcome],
    clusters: list[Cluster] | None = None,
) -> str:
    """Gap 5C — Monday-morning markdown report: is the system getting smarter?"""

    def avg_mttr(outcomes: list[IncidentOutcome]) -> float:
        return statistics.mean(o.mttr_minutes for o in outcomes) if outcomes else 0.0

    mttr_now, mttr_prev = avg_mttr(this_week), avg_mttr(last_week)
    delta_pct = ((mttr_prev - mttr_now) / mttr_prev * 100) if mttr_prev else 0.0
    successes = [o for o in this_week if o.classification == SUCCESS]
    success_rate = (len(successes) / len(this_week) * 100) if this_week else 0.0

    counts: dict[str, int] = {}
    for o in this_week:
        key = o.pattern_text[:64]
        counts[key] = counts.get(key, 0) + 1
    top = sorted(counts.items(), key=lambda kv: kv[1], reverse=True)[:5]

    known = {o.pattern_text[:64] for o in last_week}
    novel = [p for p in counts if p not in known]
    systemic = [c for c in (clusters or []) if c.systemic]

    lines = [
        "# Weekly Intelligence Report",
        "",
        f"**Incidents:** {len(this_week)} · **Success rate:** {success_rate:.0f}% · "
        f"**Avg MTTR:** {mttr_now:.2f} min ({delta_pct:+.0f}% vs last week — "
        f"{'the system is getting smarter' if delta_pct > 0 else 'investigate regression'})",
        "",
        "## Top incident patterns",
        *[f"{i + 1}. `{p}` × {n}" for i, (p, n) in enumerate(top)],
        "",
        "## New patterns (unknown unknowns)",
        *([f"- `{p}`" for p in novel] or ["- none — every incident matched known patterns"]),
        "",
        "## Systemic issues",
        *(
            [f"- {len(c.incident_ids)} incidents across tenants {', '.join(c.tenants) or '—'}: `{c.representative[:64]}`" for c in systemic]
            or ["- none detected"]
        ),
    ]
    return "\n".join(lines)

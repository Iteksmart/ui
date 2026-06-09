"""Layer 3 — GOVERN. Policy-as-code engine with per-tenant overrides.

Closes Gaps 3A/3B. Policies carry string conditions like the spec shows
("action.type == 'restart' and daily_count > 3"), but they are evaluated with
a whitelisted-AST interpreter — never eval(). Unknown syntax fails CLOSED:
a policy that cannot be evaluated requires human approval, by design.

Decisions: allow < require_human_approval < block (most restrictive wins).
"""

from __future__ import annotations

import ast
from dataclasses import dataclass, field
from typing import Any

ALLOW = "allow"
REQUIRE_HUMAN = "require_human_approval"
BLOCK = "block"

_SEVERITY = {ALLOW: 0, REQUIRE_HUMAN: 1, BLOCK: 2}

_ALLOWED_NODES = (
    ast.Expression, ast.BoolOp, ast.And, ast.Or, ast.UnaryOp, ast.Not,
    ast.Compare, ast.Eq, ast.NotEq, ast.Gt, ast.GtE, ast.Lt, ast.LtE,
    ast.In, ast.NotIn, ast.Name, ast.Attribute, ast.Constant, ast.Load,
    ast.Tuple, ast.List,
)


class PolicyEvaluationError(ValueError):
    """Condition could not be safely evaluated."""


def _resolve(node: ast.AST, context: dict[str, Any]) -> Any:
    """Resolve a Name/Attribute chain like action.target.env against nested dicts."""
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, (ast.Tuple, ast.List)):
        return tuple(_resolve(element, context) for element in node.elts)
    if isinstance(node, ast.Name):
        if node.id not in context:
            raise PolicyEvaluationError(f"unknown name: {node.id}")
        return context[node.id]
    if isinstance(node, ast.Attribute):
        base = _resolve(node.value, context)
        if isinstance(base, dict) and node.attr in base:
            return base[node.attr]
        raise PolicyEvaluationError(f"unknown attribute: {node.attr}")
    raise PolicyEvaluationError(f"unsupported value node: {type(node).__name__}")


def _evaluate(node: ast.AST, context: dict[str, Any]) -> bool:
    if not isinstance(node, _ALLOWED_NODES):
        raise PolicyEvaluationError(f"disallowed syntax: {type(node).__name__}")
    if isinstance(node, ast.Expression):
        return _evaluate(node.body, context)
    if isinstance(node, ast.BoolOp):
        results = (_evaluate(value, context) for value in node.values)
        return all(results) if isinstance(node.op, ast.And) else any(results)
    if isinstance(node, ast.UnaryOp) and isinstance(node.op, ast.Not):
        return not _evaluate(node.operand, context)
    if isinstance(node, ast.Compare):
        left = _resolve(node.left, context)
        for op, comparator in zip(node.ops, node.comparators):
            right = _resolve(comparator, context)
            ok = (
                left == right if isinstance(op, ast.Eq)
                else left != right if isinstance(op, ast.NotEq)
                else left > right if isinstance(op, ast.Gt)
                else left >= right if isinstance(op, ast.GtE)
                else left < right if isinstance(op, ast.Lt)
                else left <= right if isinstance(op, ast.LtE)
                else left in right if isinstance(op, ast.In)
                else left not in right if isinstance(op, ast.NotIn)
                else None
            )
            if ok is None:
                raise PolicyEvaluationError(f"unsupported operator: {type(op).__name__}")
            if not ok:
                return False
            left = right
        return True
    raise PolicyEvaluationError(f"unsupported node: {type(node).__name__}")


def evaluate_condition(condition: str, context: dict[str, Any]) -> bool:
    """Safely evaluate a policy condition against a context dict."""
    try:
        tree = ast.parse(condition, mode="eval")
    except SyntaxError as e:
        raise PolicyEvaluationError(f"invalid condition syntax: {e}") from e
    return _evaluate(tree, context)


@dataclass(frozen=True)
class Policy:
    name: str
    condition: str
    action: str  # allow | require_human_approval | block
    message: str = ""
    tenant: str | None = None  # None = global default


@dataclass
class Decision:
    action: str
    matched: list[Policy] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)

    @property
    def allowed(self) -> bool:
        return self.action == ALLOW

    @property
    def messages(self) -> list[str]:
        return [p.message or p.name for p in self.matched]


DEFAULT_POLICIES: list[Policy] = [
    Policy(
        name="No DB changes during business hours",
        condition="action.type == 'database' and time.hour >= 9 and time.hour <= 17",
        action=REQUIRE_HUMAN,
        message="Database changes blocked during business hours",
    ),
    Policy(
        name="Production restart limit",
        condition="action.type == 'restart' and action.target.env == 'production' and daily_count > 3",
        action=BLOCK,
        message="More than 3 production restarts today — blocking auto-remediation",
    ),
    Policy(
        name="HIPAA workload protection",
        condition="action.target.hipaa_scope == True",
        action=REQUIRE_HUMAN,
        message="HIPAA-scoped workload — human approval mandatory",
    ),
    Policy(
        name="Protected services are never auto-touched",
        condition="action.target.name in ('djuane-ai', 'suite-postgres', 'suite-nginx')",
        action=BLOCK,
        message="Protected service — requires explicit DJuane approval",
    ),
]


class PolicyEngine:
    """Evaluates global policies plus per-tenant overrides (Gap 3B).

    Tenant policies are additive: tenants can only tighten governance, never
    loosen it — a global BLOCK can't be overridden back to allow.
    """

    def __init__(self, policies: list[Policy] | None = None):
        self.policies = list(policies if policies is not None else DEFAULT_POLICIES)

    def add(self, policy: Policy) -> None:
        self.policies.append(policy)

    def decide(self, context: dict[str, Any], tenant: str | None = None) -> Decision:
        decision = Decision(action=ALLOW)
        for policy in self.policies:
            if policy.tenant is not None and policy.tenant != tenant:
                continue
            try:
                if evaluate_condition(policy.condition, context):
                    decision.matched.append(policy)
                    if _SEVERITY[policy.action] > _SEVERITY[decision.action]:
                        decision.action = policy.action
            except PolicyEvaluationError as e:
                # fail closed: an unevaluable policy forces a human decision
                decision.errors.append(f"{policy.name}: {e}")
                if _SEVERITY[REQUIRE_HUMAN] > _SEVERITY[decision.action]:
                    decision.action = REQUIRE_HUMAN
        return decision

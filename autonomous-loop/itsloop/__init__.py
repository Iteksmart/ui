"""itsloop — the iTechSmart Autonomous Loop: Sense → Think → Govern → Act → Learn."""

from .act import TerraformExecutor, TerraformOperationDenied
from .govern import ALLOW, BLOCK, REQUIRE_HUMAN, Decision, Policy, PolicyEngine
from .learn import CorrelationEngine, FeedbackLoop, IncidentOutcome, intelligence_report
from .sense import HashingEmbedder, InMemoryVectorStore, SemanticDetector, redact
from .think import CyclicalLoop, ExecutionResult, KillSwitchEngaged, Plan, route_incident

__all__ = [
    "ALLOW", "BLOCK", "REQUIRE_HUMAN",
    "CorrelationEngine", "CyclicalLoop", "Decision", "ExecutionResult",
    "FeedbackLoop", "HashingEmbedder", "IncidentOutcome", "InMemoryVectorStore",
    "KillSwitchEngaged", "Plan", "Policy", "PolicyEngine", "SemanticDetector",
    "TerraformExecutor", "TerraformOperationDenied",
    "intelligence_report", "redact", "route_incident",
]
__version__ = "1.0.0"

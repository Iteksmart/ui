"""Layer 4 — ACT. Whitelisted Terraform execution guard (Gap 4C).

Only four operation families are ever allowed, destroy/force-replace and
untargeted applies are structurally impossible, and every operation produces
a pre-plan seal and a post-verify seal. Composio OAuth and n8n activation are
credential flows that must run on the server — see the README.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable

ALLOWED_OPERATIONS = {
    "scale_replicas": {"module": "module.containers", "vars": ("service", "replicas")},
    "cloudflare_dns_update": {"module": "module.dns", "vars": ("record", "value")},
    "security_group_rule": {"module": "module.firewall", "vars": ("rule", "action")},
    "r2_bucket_create": {"module": "module.backups", "vars": ("bucket",)},
}

FORBIDDEN_TOKENS = ("destroy", "-replace", "force", "taint", "import", "rm ", ";", "&&", "|")


class TerraformOperationDenied(PermissionError):
    pass


@dataclass
class TerraformRun:
    operation: str
    target: str
    commands: list[list[str]]
    applied: bool
    receipts: list[str] = field(default_factory=list)


class TerraformExecutor:
    """Builds argv-style terraform commands — no shell, no interpolation."""

    def __init__(
        self,
        seal: Callable[[str, dict[str, Any]], str] = lambda category, data: "",
        runner: Callable[[list[str]], int] | None = None,
        dry_run: bool = True,
    ):
        self.seal = seal
        self.runner = runner
        self.dry_run = dry_run

    def validate(self, operation: str, variables: dict[str, Any]) -> dict[str, Any]:
        if operation not in ALLOWED_OPERATIONS:
            raise TerraformOperationDenied(f"operation '{operation}' is not whitelisted")
        spec = ALLOWED_OPERATIONS[operation]
        missing = [v for v in spec["vars"] if v not in variables]
        if missing:
            raise TerraformOperationDenied(f"missing required vars: {missing}")
        for value in variables.values():
            text = str(value).lower()
            if any(tok in text for tok in FORBIDDEN_TOKENS):
                raise TerraformOperationDenied(f"forbidden token in variable value: {value!r}")
        return spec

    def execute(self, operation: str, variables: dict[str, Any]) -> TerraformRun:
        spec = self.validate(operation, variables)
        target = spec["module"]
        var_args = [f"-var={k}={variables[k]}" for k in spec["vars"]]
        plan_cmd = ["terraform", "plan", f"-target={target}", *var_args, "-out=tfplan"]
        apply_cmd = ["terraform", "apply", "-auto-approve", "tfplan"]

        run = TerraformRun(operation=operation, target=target, commands=[plan_cmd, apply_cmd], applied=False)
        run.receipts.append(self.seal("terraform_pre_plan", {"operation": operation, "target": target, "vars": variables}))

        if not self.dry_run and self.runner is not None:
            if self.runner(plan_cmd) != 0:
                run.receipts.append(self.seal("terraform_plan_failed", {"operation": operation}))
                return run
            if self.runner(apply_cmd) != 0:
                run.receipts.append(self.seal("terraform_apply_failed", {"operation": operation}))
                return run
            run.applied = True

        run.receipts.append(
            self.seal("terraform_post_verify", {"operation": operation, "applied": run.applied, "dry_run": self.dry_run})
        )
        return run

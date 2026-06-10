"""ProofLink HTTP client. Stdlib-only — no dependencies to vendor or audit."""

from __future__ import annotations

import json
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from typing import Any

DEFAULT_API_BASE = "https://api.itechsmart.dev"
DEFAULT_VERIFY_BASE = "https://verify.itechsmart.dev"
_TIMEOUT = 15


class ProofLinkError(RuntimeError):
    """Raised when the ProofLink API returns an error or is unreachable."""

    def __init__(self, message: str, status: int | None = None):
        super().__init__(message)
        self.status = status


@dataclass(frozen=True)
class Receipt:
    id: str
    category: str
    chain_position: int | None = None
    sealed_at: str | None = None
    verify_url: str = ""
    raw: dict[str, Any] = field(default_factory=dict, repr=False)


@dataclass(frozen=True)
class VerifyResult:
    found: bool
    chain_intact: bool
    chain_position: int | None = None
    anchored: bool = False
    raw: dict[str, Any] = field(default_factory=dict, repr=False)


class ProofLink:
    """Client for sealing and verifying ProofLink receipts."""

    def __init__(
        self,
        api_key: str | None = None,
        tenant: str | None = None,
        api_base: str = DEFAULT_API_BASE,
        verify_base: str = DEFAULT_VERIFY_BASE,
    ):
        self.api_key = api_key
        self.tenant = tenant
        self.api_base = api_base.rstrip("/")
        self.verify_base = verify_base.rstrip("/")

    # ── HTTP plumbing ────────────────────────────────────────────────
    def _request(self, method: str, url: str, body: dict[str, Any] | None = None) -> dict[str, Any]:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method=method)
        req.add_header("Accept", "application/json")
        req.add_header("User-Agent", "itechsmart-prooflink-python/1.0.0")
        if data is not None:
            req.add_header("Content-Type", "application/json")
        if self.api_key:
            req.add_header("Authorization", f"Bearer {self.api_key}")
        if self.tenant:
            req.add_header("X-ITS-Tenant", self.tenant)
        try:
            with urllib.request.urlopen(req, timeout=_TIMEOUT) as res:
                payload = res.read().decode() or "{}"
                return json.loads(payload)
        except urllib.error.HTTPError as e:
            detail = e.read().decode(errors="replace")[:300]
            raise ProofLinkError(f"{method} {url} -> HTTP {e.code}: {detail}", status=e.code) from e
        except urllib.error.URLError as e:
            raise ProofLinkError(f"{method} {url} unreachable: {e.reason}") from e
        except json.JSONDecodeError as e:
            raise ProofLinkError(f"{method} {url} returned invalid JSON") from e

    # ── API surface ──────────────────────────────────────────────────
    def seal(
        self,
        category: str,
        actor: str,
        action: str,
        outcome: str = "success",
        metadata: dict[str, Any] | None = None,
    ) -> Receipt:
        """Seal a receipt via POST /api/v1/receipts/seal."""
        if not category or not actor or not action:
            raise ValueError("category, actor, and action are required")
        body: dict[str, Any] = {
            "category": category,
            "actor": actor,
            "action": action,
            "outcome": outcome,
        }
        if metadata:
            body["metadata"] = metadata
        if self.tenant:
            body["tenant"] = self.tenant
        raw = self._request("POST", f"{self.api_base}/api/v1/receipts/seal", body)
        rid = str(raw.get("id") or raw.get("receipt_id") or "")
        if not rid:
            raise ProofLinkError(f"seal succeeded but no receipt id in response: {raw}")
        return Receipt(
            id=rid,
            category=category,
            chain_position=raw.get("chain_position"),
            sealed_at=raw.get("sealed_at"),
            verify_url=raw.get("verify_url") or f"{self.verify_base}/api/verify/{rid}",
            raw=raw,
        )

    def verify(self, receipt_id: str) -> VerifyResult:
        """Verify a receipt via the public ledger — no auth required."""
        if not receipt_id:
            raise ValueError("receipt_id is required")
        raw = self._request("GET", f"{self.verify_base}/api/verify/{receipt_id}")
        # live API nests the verdict under "receipt" (v2 schema); accept both shapes
        receipt = raw.get("receipt") or {}
        return VerifyResult(
            found=bool(raw.get("found", raw.get("ok", False))),
            chain_intact=bool(receipt.get("verified",
                              raw.get("chain_intact", raw.get("valid", False)))),
            chain_position=receipt.get("chain_position", raw.get("chain_position")),
            anchored=bool(raw.get("anchored", receipt.get("verified", False))),
            raw=raw,
        )

    def stats(self) -> dict[str, Any]:
        """Public ledger stats — GET {verify_base}/api/stats."""
        return self._request("GET", f"{self.verify_base}/api/stats")

    def status(self) -> dict[str, Any]:
        """Platform health — GET {api_base}/v1/status."""
        return self._request("GET", f"{self.api_base}/v1/status")

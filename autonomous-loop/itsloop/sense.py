"""Layer 1 — SENSE. Semantic anomaly detection against incident memory.

Closes Gap 1B: log windows are embedded, redacted, and matched against the
historical incident library. A >= 0.85 similarity hit returns the remediation
that worked last time; a high-novelty window escalates as an unknown anomaly.

The embedder is pluggable: HashingEmbedder is deterministic and dependency-free
(used in tests and as an offline fallback); production swaps in the Letta
MegaMind embedding endpoint without changing any calling code.
"""

from __future__ import annotations

import hashlib
import math
import re
import time
from dataclasses import dataclass, field
from typing import Any, Protocol

# ── Embeddings ───────────────────────────────────────────────────────


class Embedder(Protocol):
    def embed(self, text: str) -> list[float]: ...


class HashingEmbedder:
    """Deterministic bag-of-tokens hashing embedder (no dependencies).

    Token overlap drives cosine similarity, which is exactly the signal log
    patterns need ("OOM in suite-octoai" ≈ "suite-octoai OOM killed").
    """

    def __init__(self, dim: int = 256):
        self.dim = dim

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        for token in re.findall(r"[a-z0-9_.-]+", text.lower()):
            h = int.from_bytes(hashlib.sha256(token.encode()).digest()[:8], "big")
            vec[h % self.dim] += 1.0
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


# ── Redaction (fill-gap: never embed secrets or PII) ─────────────────

_REDACTIONS = [
    (re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+"), "<email>"),
    (re.compile(r"(?i)bearer\s+[a-z0-9_\-.=]+"), "Bearer <token>"),
    (re.compile(r"(?i)(api[_-]?key|token|secret|password)\s*[=:]\s*\S+"), r"\1=<redacted>"),
    (re.compile(r"\b\d{1,3}(?:\.\d{1,3}){3}\b"), "<ip>"),
]


def redact(text: str) -> str:
    for pattern, replacement in _REDACTIONS:
        text = pattern.sub(replacement, text)
    return text


# ── Vector store ─────────────────────────────────────────────────────


@dataclass
class StoredPattern:
    id: str
    text: str
    metadata: dict[str, Any]
    vector: list[float]
    stored_at: float = field(default_factory=time.time)


class InMemoryVectorStore:
    """pgvector stand-in with the same upsert/search surface.

    Search scores decay slightly with age (half-life ~90 days) so stale
    remediations gradually lose authority — a gap the spec left open.
    """

    HALF_LIFE_DAYS = 90.0

    def __init__(self, embedder: Embedder | None = None):
        self.embedder = embedder or HashingEmbedder()
        self._items: dict[str, StoredPattern] = {}

    def upsert(self, id: str, text: str, metadata: dict[str, Any] | None = None) -> None:
        clean = redact(text)
        self._items[id] = StoredPattern(
            id=id, text=clean, metadata=metadata or {}, vector=self.embedder.embed(clean)
        )

    def search(self, text: str, top_k: int = 5, now: float | None = None) -> list[tuple[float, StoredPattern]]:
        query = self.embedder.embed(redact(text))
        now = now if now is not None else time.time()
        scored = []
        for item in self._items.values():
            age_days = max(0.0, (now - item.stored_at) / 86400.0)
            decay = 0.5 ** (age_days / self.HALF_LIFE_DAYS)
            scored.append((cosine(query, item.vector) * decay, item))
        scored.sort(key=lambda pair: pair[0], reverse=True)
        return scored[:top_k]

    def __len__(self) -> int:
        return len(self._items)


# ── Semantic detector ────────────────────────────────────────────────


@dataclass(frozen=True)
class Detection:
    kind: str  # "known_pattern" | "novel_anomaly" | "normal"
    similarity: float
    matched_id: str | None = None
    suggested_remediation: str | None = None
    expected_mttr_minutes: float | None = None
    message: str = ""


class SemanticDetector:
    """Matches a live log window against the historical incident library."""

    def __init__(
        self,
        store: InMemoryVectorStore,
        match_threshold: float = 0.85,
        anomaly_keywords: tuple[str, ...] = ("error", "critical", "fatal", "panic", "oom", "refused"),
    ):
        self.store = store
        self.match_threshold = match_threshold
        self.anomaly_keywords = anomaly_keywords

    def analyze(self, log_window: str) -> Detection:
        hits = self.store.search(log_window, top_k=1)
        best_score, best = (hits[0][0], hits[0][1]) if hits else (0.0, None)

        if best is not None and best_score >= self.match_threshold:
            return Detection(
                kind="known_pattern",
                similarity=best_score,
                matched_id=best.id,
                suggested_remediation=best.metadata.get("remediation"),
                expected_mttr_minutes=best.metadata.get("mttr_minutes"),
                message=(
                    f"Pattern matches incident {best.id} "
                    f"(similarity {best_score:.2f}) — known fix available"
                ),
            )

        looks_anomalous = any(k in log_window.lower() for k in self.anomaly_keywords)
        if looks_anomalous:
            return Detection(
                kind="novel_anomaly",
                similarity=best_score,
                message="Unknown anomaly pattern detected — escalating to AG2 with no prior context",
            )
        return Detection(kind="normal", similarity=best_score, message="No anomaly signal")

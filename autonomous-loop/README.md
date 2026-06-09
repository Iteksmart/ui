# The Autonomous Loop — Sense → Think → Govern → Act → Learn

Implementation of the Autonomous Loop build spec. The decision logic for every
gap is here as a tested, dependency-free Python package (`itsloop`, 23 tests),
designed to drop into `/opt/itechsmart/` and wire to the live services.

## What's implemented (and tested)

| Spec gap | Module | Highlights |
|----------|--------|------------|
| 1B Semantic anomaly detector | `itsloop/sense.py` | ≥0.85 similarity → returns the remediation that worked last time; novel anomalies escalate. Pluggable embedder (offline `HashingEmbedder` now, Letta endpoint in prod) |
| 2A Cyclical retry loop | `itsloop/think.py` | plan → gate → execute with failure context fed back, `max_cycles=3`, escalation to HumanArbiter, receipt per cycle |
| 2B Specialist routing | `itsloop/think.py` | DB/Security/Network/Cost/Compliance agents with the spec's Claude/Nemotron split |
| 3A Policy-as-code | `itsloop/govern.py` | String conditions evaluated via **whitelisted AST — never `eval()`**; unevaluable policies fail CLOSED to human approval |
| 3B Per-tenant policies | `itsloop/govern.py` | Tenant policies can only tighten, never loosen; most-restrictive decision wins |
| 4C Terraform guard | `itsloop/act.py` | Four whitelisted op families, destroy/force structurally impossible, argv-only (no shell), pre-plan + post-verify seals |
| 5A Feedback loop | `itsloop/learn.py` | Outcomes stored with classification; failures become **negative examples** ("do NOT use plan X") |
| 5B Correlation engine | `itsloop/learn.py` | 3+ incidents ≥0.85 similar → systemic flag with tenant list |
| 5C Intelligence report | `itsloop/learn.py` | Markdown: top patterns, MTTR vs last week, unknown unknowns, systemic issues |
| 1A Vector pipeline | `vector/vector.toml` | Completed config: redaction at source, disk buffering, info-sampling, self-metrics |

## Gaps filled beyond the spec

- **Kill switch** — one switch stops all autonomous remediation (`CyclicalLoop(kill_switch=...)`)
- **Dry-run mode** — full plan/gate cycle with zero execution, for safe rollout
- **PII/secret redaction** — emails, bearer tokens, api keys, IPs scrubbed *before* embedding, both in Python and at the Vector source
- **Pattern confidence decay** — remediations lose authority with age (90-day half-life), so stale fixes don't outrank fresh evidence
- **Fail-closed governance** — a policy that can't be parsed forces human approval instead of being skipped
- **Protected-services policy** — djuane-ai / suite-postgres / suite-nginx are BLOCK-listed from auto-remediation by default

## Run the tests

```bash
cd autonomous-loop
python3 -m unittest discover -s tests   # 23 tests
```

The acceptance criteria from the spec are encoded as tests, including
"run 3 incidents → the 3rd resolves with the fix already in context" and
the full Sense→Think→Govern→Act→Learn roundtrip.

## What still needs the OVH server

Wiring, not logic: deploy Vector (`vector/vector.toml` + the docker run from
the spec), point `InMemoryVectorStore` calls at suite-letta:8100/pgvector,
register the cyclical loop inside AG2's GroupChat, store policies in the
`arbiter_policies` table, complete Composio OAuth (browser flow + Vault),
activate n8n WF-01–04, and give the Terraform executor real credentials.
Each ships independently — per the spec, don't wait for all 14.

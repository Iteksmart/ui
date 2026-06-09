# Enterprise Sprint — Status Tracker

Honest state of the 25-task sprint. ✅ = built **and verified** in this repo.
🔶 = needs the OVH server / external credentials — this cloud sandbox has no
SSH key, port 22 is unreachable, and `*.itechsmart.dev` egress is blocked, so
nothing server-side can be deployed or receipt-sealed from here. Per the
standing rule, no receipt is claimed for anything not live-verified.

| # | Task | Status | Where / what's next |
|---|------|--------|---------------------|
| 0 | GitHub push + deploy 20 UIs | 🔶 blocked → runbook ready | Push: session credential still 403 (git proxy + GitHub API) — grant must reach the Claude GitHub App install for `Iteksmart/ui`, or run a fresh session. Deploy: `templates/itechsmart-suite/deploy/DEPLOYMENT.md` |
| 1 | Nemotron ↔ Hermes router | 🔶 server-side | Targets `/opt/itechsmart/hermes-router/` + Hermes profiles + ag2.env — needs OVH |
| 2 | C-13 autonomous coding loop | 🔶 server-side | Five services under `/opt/itechsmart/c13/` + Daytona key — needs OVH |
| 3 | Automated sales pipeline | 🔶 server-side + Apollo creds | Crons under `/opt/itechsmart/sales/` |
| 4 | LinkedIn marketing engine | 🔶 server-side + Make/LinkedIn | `/opt/itechsmart/marketing/` + Make 5300055 fix |
| 5 | Self-healing platform | 🔶 server-side | systemd watchdog needs docker socket on OVH |
| 6 | Multi-tenancy | 🔶 server-side | Postgres DDL + RLS on suite-postgres |
| 7 | Enterprise SSO | 🔶 server-side | SAML/OIDC endpoints in djuane-ai (test on 39202) |
| 8 | **Developer SDKs** | ✅ `sdk/python` + `sdk/typescript` | Python 7/7 tests, TS 6/6 tests. PyPI/npm publish needs registry creds |
| 9 | **CLI `its`** | ✅ `sdk/python` (console script) | status/stats/verify/seal/incidents/cert — tested against mock API |
| 10 | ServiceNow connector | 🔶 server-side + SNOW creds | `/opt/itechsmart/iTechSmart-Suite/connectors/` |
| 11 | Splunk connector | 🔶 server-side + HEC token | same |
| 12 | ML anomaly detection | 🔶 server-side | needs ledger.json access |
| 13 | **Self-service signup portal** | ✅ `signup.itechsmart.dev` | Animated 4-step flow with live ICP scoring → tier routing. Tenant/Daytona API calls are simulated until wired to djuane-ai |
| 14 | **Partner/reseller portal** | ✅ `partner.itechsmart.dev` | Multi-client grid, 30% rev share math, cross-client correlation alert, bulk evidence pack |
| 15 | **Usage metering + billing dashboard** | ✅ UI at `billing.itechsmart.dev` | Usage vs limits, forecast warning, invoices, tier ladder. Stripe Meters push is server-side |
| 16 | Compliance evidence automation | 🔶 server-side | needs Wazuh/LUKS/uptime data |
| 17 | **Developer portal** | ✅ `docs.itechsmart.dev` | Docs index + interactive API playground (simulated responses until proxied to live API) + SDK quickstarts |
| 18 | White-label | 🔶 needs tenant table (task 6) | Config shape documented in partner portal |
| 19 | VS Code extension | 🔶 not started | scaffold next |
| 20 | Terraform provider | 🔶 not started | needs Go toolchain + API endpoints |
| 21 | K8s operator | 🔶 not started | |
| 22 | AI blog engine | 🔶 server-side + Vercel API | |
| 23 | Capacity planning | 🔶 server-side telemetry | |
| 24 | API marketplace | ✅ UI exists (`marketplace.itechsmart.dev`) | payments/rev-split are server-side |
| 25 | **Mobile PWA** | ✅ in `templates/itechsmart-suite` | manifest + service worker (offline shell, cached last stats) + installable icon — verified serving |

**Suite totals:** 24 frontends, one container, one design system. `tsc` zero
errors, production build clean (29 routes), all Host headers smoke-tested,
PWA assets verified.

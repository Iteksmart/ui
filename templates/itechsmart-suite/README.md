# iTechSmart Suite — 20 Frontends, One Design System

A complete rebuild of every OVH suite frontend to the Master Platform Context
§10 specification (Lovable.dev quality bar): Geist typography, the
`#5B2D8E` purple token system, full dark/light mode, the entire §10 animation
sheet, skeleton loaders, and real empty/error states — on every single app.

**One Next.js 15 container serves all twenty subdomains.** `src/middleware.ts`
reads the Host header and rewrites `verify.itechsmart.dev` → `/verify`,
`warroom.itechsmart.dev` → `/warroom`, and so on. Twenty nginx vhosts, one
upstream, one design system, one deploy.

## The twenty apps

| # | Subdomain | App |
|---|-----------|-----|
| 1 | verify.itechsmart.dev | Public ProofLink ledger — hero stats, receipt verifier, live chain, auditor CTA |
| 2 | warroom.itechsmart.dev | Incident command — live feed, AG2 6-agent pipeline, SSE flash |
| 3 | arbiter.itechsmart.dev | SEMI_AUTO approval queue — confirm dialogs, decision history |
| 4 | impactos.itechsmart.dev | Business value — $ saved, hours returned, MTTR before/after |
| 5 | generative-workflow.itechsmart.dev | NL → workflow JSON with blast-radius gating |
| 6 | architect.itechsmart.dev | Interactive d3-force CMDB graph with click-to-blast-radius |
| 7 | certification.itechsmart.dev | UAIO Bronze/Silver/Gold progression with criteria |
| 8 | twin.itechsmart.dev | Digital Twin what-if failure simulation |
| 9 | market.itechsmart.dev | Marketing intelligence — campaigns, engagement |
| 10 | roi.itechsmart.dev | Interactive ROI calculator with live math |
| 11 | knowledge-graph.itechsmart.dev | CMDB query + type breakdown |
| 12 | prooflink.itechsmart.dev | Ledger management — stats, verify, chain |
| 13 | pulse.itechsmart.dev | Endpoint scanner — HTTP/latency/SSL |
| 14 | connect.itechsmart.dev | Integration flavors hub (§8) |
| 15 | notify.itechsmart.dev | Unified notification center |
| 16 | workflow.itechsmart.dev | n8n + Make fleet status |
| 17 | rpa.itechsmart.dev | Robot fleet dashboard |
| 18 | forge.itechsmart.dev | Build pipeline + recent builds |
| 19 | edge.itechsmart.dev | Regions, tunnel, rollout health |
| 20 | marketplace.itechsmart.dev | Workflow marketplace |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind v4 ·
Motion (Framer Motion) · Recharts · d3-force · TanStack Query · Geist · Lucide.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3300 — launcher grid links to all 20 apps
npm run typecheck    # zero errors
npm run build        # all routes static, middleware handles hosts
```

Without env vars the suite runs on a live simulator (numbers tick, incidents
stream, receipts seal). Set `NEXT_PUBLIC_ITS_API_BASE` /
`NEXT_PUBLIC_ITS_VERIFY_BASE` to wire the §4 endpoints; every fetch falls back
to the simulator on failure so no page ever blanks.

## Deploy

See [`deploy/DEPLOYMENT.md`](deploy/DEPLOYMENT.md) — temp-port smoke test for
all twenty Host headers, per-subdomain nginx cutover with reload-only, live
verification before any receipt is sealed, and per-subdomain rollback.

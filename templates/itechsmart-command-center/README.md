# iTechSmart Command Center

GTM Command Center for the iTechSmart UAIO platform — live platform health, AG2
multi-agent incident response, SEMI_AUTO governance approvals, and the ProofLink
cryptographic audit ledger. Built to the Master Platform Context §10 design
specification.

![Command Center](https://img.shields.io/badge/status-OPERATIONAL-1D9E75) ![Design](https://img.shields.io/badge/design-Lovable.dev%20bar-5B2D8E)

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript strict**
- **Tailwind CSS v4** — iTechSmart design tokens as CSS variables, full dark/light mode
- **Motion (Framer Motion)** — every animation from the spec sheet
- **Recharts** — trend areas, funnel bars, sparklines
- **TanStack React Query** — polling, caching, loading/error/empty states
- **Geist Sans / Geist Mono** + **Lucide** icons

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Platform overview — receipts, MTTR, containers, autonomy, funnel, pilot pipeline |
| `/warroom` | Live incident feed with the 6-agent AG2 pipeline visualization |
| `/arbiter` | SEMI_AUTO approval queue — confirm dialogs, toasts, decision history |
| `/prooflink` | Ledger stats, receipt verification, live receipt chain with seal flash |

## Spec compliance

- Page load fade-in + 8px slide (300ms ease-out), metric card stagger (50ms/card)
- Count-up numbers (500ms), pulsing OPERATIONAL badge (2s loop)
- Card hover lift (`translateY(-2px)`, 150ms), button press scale (0.97, 100ms)
- Skeleton shimmer loaders (1.5s linear), SSE row flash (500ms), seal flash (400ms)
- Chart draw-in (600ms), spring modals (scale 0.95→1), alert banner slide-down (250ms)
- Dark mode default with a toggle in the topbar of every page — all colors are CSS
  variables, zero hardcoded hex in components
- Command palette (⌘K), keyboard-accessible dialogs, responsive at 320/768/1024/1440
- Footer "Powered by ProofLink" on every page; external links `rel="noopener noreferrer"`

## Run it

```bash
npm install
npm run dev        # http://localhost:3210 (same port as itechsmart-dashboard)
npm run build && npm start
npm run typecheck  # tsc --noEmit, zero errors
```

## Live data

Out of the box the app runs on a built-in simulator so every panel is alive —
receipts tick up, incidents stream through the AG2 pipeline, MTTR drifts. To wire
it to the real platform set:

```bash
NEXT_PUBLIC_ITS_API_BASE=https://api.itechsmart.dev
NEXT_PUBLIC_ITS_VERIFY_BASE=https://verify.itechsmart.dev
```

Hooks in `src/lib/api.ts` fetch the live endpoints (`/v1/status/live`,
`/api/stats`) with `cache: no-store` and fall back to the simulator on any
failure — the UI never blanks out.

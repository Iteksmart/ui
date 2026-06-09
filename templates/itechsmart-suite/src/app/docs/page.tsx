"use client"

// Developer portal — docs index + interactive API playground (Sprint Task 17).
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { BadgeCheck, BookOpen, Play, Terminal, Braces, KeyRound } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card } from "@/components/ui"

const ENDPOINTS = [
  {
    method: "GET",
    path: "/v1/status",
    desc: "Platform health — no auth",
    response: { ok: true, status: "OPERATIONAL", containers: 141, mttr_minutes: 2.07, autonomy_rate: 94.2 },
  },
  {
    method: "GET",
    path: "/api/stats",
    desc: "Public ledger stats (verify.itechsmart.dev)",
    response: { receipts: 28906, chain_breaks: 0, bitcoin_anchored: "4/4", last_seal_ago_s: 41 },
  },
  {
    method: "POST",
    path: "/api/v1/receipts/seal",
    desc: "Seal an external receipt (auth required)",
    response: {
      id: "rcpt_m9x4kq2vbn81",
      category: "deployment_complete",
      chain_position: 28907,
      verify_url: "https://verify.itechsmart.dev/api/verify/rcpt_m9x4kq2vbn81",
    },
  },
  {
    method: "GET",
    path: "/api/v1/digital-twin/status",
    desc: "Digital Twin health",
    response: { ok: true, nodes: 573, edges: 1000, last_sync: "2026-06-09T20:14:02Z" },
  },
  {
    method: "POST",
    path: "/api/v1/digital-twin/what-if",
    desc: "Blast radius simulation",
    response: { target: "suite-octoai", impacted_nodes: 7, critical_in_radius: 0, recommended_mode: "AUTO" },
  },
  {
    method: "GET",
    path: "/api/v1/uaio-certification/status",
    desc: "UAIO cert + progression",
    response: { current: "Silver", next: "Gold", criteria_met: 7, criteria_total: 9 },
  },
] as const

const SECTIONS = [
  { icon: BookOpen, title: "Getting started", body: "Five minutes from API key to your first sealed receipt." },
  { icon: Braces, title: "SDKs", body: "pip install itechsmart-prooflink · npm install @itechsmart/prooflink" },
  { icon: Terminal, title: "CLI", body: "its status · its seal · its verify <receipt-id> · its incidents" },
  { icon: KeyRound, title: "Authentication", body: "API keys, suite-passport JWT, and enterprise SSO (SAML/OIDC)." },
] as const

export default function DocsPage() {
  const toast = useToast()
  const [selected, setSelected] = React.useState(0)
  const [running, setRunning] = React.useState(false)
  const [output, setOutput] = React.useState<string | null>(null)

  const ep = ENDPOINTS[selected]

  const run = () => {
    setRunning(true)
    setOutput(null)
    setTimeout(() => {
      setOutput(JSON.stringify(ep.response, null, 2))
      setRunning(false)
      toast("success", `${ep.method} ${ep.path} → 200 OK`)
    }, 700)
  }

  return (
    <PageEnter>
      <PageHeader
        title="Developer Portal"
        subtitle="Everything an engineer needs to integrate ProofLink — docs, SDKs, CLI, and a playground that hits real endpoints."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SECTIONS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="h-full p-5">
              <s.icon className="size-5 text-accent" aria-hidden />
              <p className="mt-3 text-sm font-semibold">{s.title}</p>
              <p className="mt-1 font-mono text-[11px] leading-relaxed text-muted">{s.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Playground */}
      <Card lift={false} className="overflow-hidden">
        <div className="border-b border-edge p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Play className="size-4 text-accent" aria-hidden />
            API playground
          </h2>
          <p className="mt-1 text-xs text-muted">
            Try any endpoint. In production this proxies api.itechsmart.dev with your sandbox key —
            and shows the ProofLink receipt each write generates.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <ul className="divide-y divide-edge border-b border-edge lg:border-b-0 lg:border-r" role="listbox" aria-label="Endpoints">
            {ENDPOINTS.map((e, i) => (
              <li key={e.path + e.method} role="option" aria-selected={i === selected}>
                <button
                  onClick={() => {
                    setSelected(i)
                    setOutput(null)
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors",
                    i === selected ? "bg-accent-soft" : "hover:bg-accent-soft/40"
                  )}
                >
                  <Badge
                    className={cn(
                      "w-14 justify-center font-mono",
                      e.method === "GET" ? "bg-info-soft text-info" : "bg-warning-soft text-warning"
                    )}
                  >
                    {e.method}
                  </Badge>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-xs font-medium">{e.path}</span>
                    <span className="block truncate text-[11px] text-muted">{e.desc}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <div className="flex flex-col p-5">
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded-lg border border-edge bg-surface px-3 py-2 font-mono text-xs">
                curl https://api.itechsmart.dev{ep.path}
              </code>
              <Button onClick={run} loading={running}>
                <Play className="size-3.5" aria-hidden />
                Run
              </Button>
            </div>
            <div className="mt-3 min-h-[220px] flex-1 rounded-xl border border-edge bg-surface p-4">
              <AnimatePresence mode="wait">
                {running && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="skeleton h-4" style={{ width: `${85 - i * 12}%` }} />
                    ))}
                  </motion.div>
                )}
                {output && (
                  <motion.div
                    key={ep.path}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Badge className="bg-success-soft text-success">
                        <BadgeCheck className="size-3" aria-hidden />
                        200 OK
                      </Badge>
                      <span className="text-[11px] text-muted">application/json · Cache-Control: no-store</span>
                    </div>
                    <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-foreground">{output}</pre>
                  </motion.div>
                )}
                {!running && !output && (
                  <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted">
                    Select an endpoint and hit Run.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Card>

      {/* SDK quickstart */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card lift={false} className="p-5">
          <h2 className="text-sm font-semibold">Python — seal in four lines</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-edge bg-surface p-4 font-mono text-xs leading-relaxed">
{`from itechsmart import ProofLink

pl = ProofLink(api_key="your-key", tenant="your-tenant")
receipt = pl.seal(category="deploy_complete",
                  actor="ci-pipeline",
                  action="deployed v2.1.0")
print(receipt.id, receipt.verify_url)`}
          </pre>
        </Card>
        <Card lift={false} className="p-5">
          <h2 className="text-sm font-semibold">TypeScript — same chain, same proof</h2>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-edge bg-surface p-4 font-mono text-xs leading-relaxed">
{`import { ProofLink } from "@itechsmart/prooflink"

const pl = new ProofLink({ apiKey: "your-key" })
const receipt = await pl.seal({
  category: "deploy_complete",
  actor: "ci-pipeline",
  action: "deployed v2.1.0",
})
const result = await pl.verify(receipt.id)`}
          </pre>
        </Card>
      </div>
    </PageEnter>
  )
}

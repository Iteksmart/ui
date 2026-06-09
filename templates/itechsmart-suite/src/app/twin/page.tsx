"use client"

// Digital Twin — what-if blast radius simulation before touching production.
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { FlaskConical, GitBranch, ShieldAlert } from "lucide-react"

import { blastRadius, demoCmdbGraph } from "@/lib/demo-suite"
import { CmdbGraphView, GraphLegend } from "@/components/cmdb-graph"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Button, Card, Skeleton } from "@/components/ui"

export default function TwinPage() {
  const { data: graph } = useQuery({ queryKey: ["cmdb"], queryFn: async () => demoCmdbGraph() })
  const [target, setTarget] = React.useState("")
  const [simulated, setSimulated] = React.useState<string | null>(null)
  const [running, setRunning] = React.useState(false)

  const impact = graph && simulated ? blastRadius(graph, simulated) : null
  const critical = graph && impact ? graph.nodes.filter((n) => impact.has(n.id) && n.critical) : []

  const simulate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!graph || !target) return
    setRunning(true)
    setSimulated(null)
    // stands in for POST /api/v1/digital-twin/what-if
    setTimeout(() => {
      setSimulated(target)
      setRunning(false)
    }, 900)
  }

  return (
    <PageEnter>
      <PageHeader
        title="Digital Twin"
        subtitle="Simulate failure before it happens. Pick a component, run what-if, and see exactly what depends on it."
      />

      <Card lift={false} className="p-6">
        <h2 className="text-sm font-semibold">What-if simulation</h2>
        <p className="mt-1 text-xs text-muted">POST /api/v1/digital-twin/what-if</p>
        <form onSubmit={simulate} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            aria-label="Component to simulate failing"
            className="h-11 flex-1 rounded-lg border border-edge bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
          >
            <option value="">Select a component to fail…</option>
            {graph?.nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </select>
          <Button type="submit" loading={running} disabled={!target} className="h-11">
            <FlaskConical className="size-4" aria-hidden />
            Run what-if
          </Button>
        </form>

        <AnimatePresence>
          {impact && simulated && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div className="rounded-xl border border-danger/30 bg-danger-soft p-4">
                <p className="text-2xl font-bold tabular-nums text-danger">{impact.size - 1}</p>
                <p className="mt-1 text-xs text-muted">dependent nodes impacted</p>
              </div>
              <div className="rounded-xl border border-warning/30 bg-warning-soft p-4">
                <p className="text-2xl font-bold tabular-nums text-warning">{critical.length}</p>
                <p className="mt-1 text-xs text-muted">critical-path services in radius</p>
              </div>
              <div className="rounded-xl border border-info/30 bg-info-soft p-4">
                <p className="text-2xl font-bold tabular-nums text-info">
                  {impact.size - 1 > 3 ? "SEMI_AUTO" : "AUTO"}
                </p>
                <p className="mt-1 text-xs text-muted">recommended execution mode</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {critical.length > 0 && (
          <div
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger"
          >
            <ShieldAlert className="size-4 shrink-0" aria-hidden />
            Touches {critical.map((c) => c.label).join(", ")} — requires explicit DJuane approval via
            Arbiter.
          </div>
        )}
      </Card>

      <Card lift={false} className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="size-4 text-accent" aria-hidden />
            Twin graph
          </h2>
          {simulated && (
            <Badge className="bg-danger-soft text-danger">simulating: {simulated} down</Badge>
          )}
          <div className="ml-auto">
            <GraphLegend />
          </div>
        </div>
        {graph ? (
          <CmdbGraphView graph={graph} selected={simulated} onSelect={setSimulated} />
        ) : (
          <Skeleton className="h-[460px] w-full" />
        )}
      </Card>
    </PageEnter>
  )
}

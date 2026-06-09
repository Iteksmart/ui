"use client"

// Interactive CMDB dependency graph with live blast-radius computation.
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { MousePointerClick, Network } from "lucide-react"

import { blastRadius, demoCmdbGraph } from "@/lib/demo-suite"
import { CountUp } from "@/components/count-up"
import { CmdbGraphView, GraphLegend } from "@/components/cmdb-graph"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

export default function ArchitectPage() {
  // stands in for GET /v1/knowledge-graph/cmdb/status + /impact/:id
  const { data: graph } = useQuery({ queryKey: ["cmdb"], queryFn: async () => demoCmdbGraph() })
  const [selected, setSelected] = React.useState<string | null>(null)

  const impact = graph && selected ? blastRadius(graph, selected) : null

  return (
    <PageEnter>
      <PageHeader
        title="Architect"
        subtitle="The platform as a living graph. Click any node to see its blast radius — what breaks if it goes down."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "CMDB nodes", value: graph?.totals.nodes },
          { label: "Dependency edges", value: graph?.totals.edges },
          { label: "Containers tracked", value: graph?.totals.types.container },
          { label: "Databases tracked", value: graph?.totals.types.database },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-4">
              <p className="text-2xl font-bold tabular-nums">
                {s.value === undefined ? <Skeleton className="h-7 w-14" /> : <CountUp value={s.value} />}
              </p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card lift={false} className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold">Dependency graph — core slice</h2>
          {selected ? (
            <Badge className="bg-danger-soft text-danger">
              <Network className="size-3" aria-hidden />
              {selected}: {impact ? impact.size - 1 : 0} dependent node{impact && impact.size - 1 === 1 ? "" : "s"}
            </Badge>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <MousePointerClick className="size-3.5" aria-hidden />
              click a node · drag to rearrange
            </span>
          )}
          <div className="ml-auto">
            <GraphLegend />
          </div>
        </div>
        {graph ? (
          <CmdbGraphView graph={graph} selected={selected} onSelect={setSelected} />
        ) : (
          <Skeleton className="h-[460px] w-full" />
        )}
        <p className="mt-3 text-xs text-muted">
          Showing the critical-path slice. Full graph ({graph?.totals.nodes ?? "…"} nodes,{" "}
          {graph?.totals.edges ?? "…"} edges) served by{" "}
          <span className="font-mono">/v1/knowledge-graph/cmdb/status</span>; per-node impact via{" "}
          <span className="font-mono">/v1/knowledge-graph/cmdb/impact/:id</span>.
        </p>
      </Card>
    </PageEnter>
  )
}

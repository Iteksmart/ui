"use client"

// CMDB knowledge graph — query interface + type breakdown.
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Layers, SearchX } from "lucide-react"

import { demoCmdbGraph } from "@/lib/demo-suite"
import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui"

const TYPE_BADGE: Record<string, string> = {
  service: "bg-info-soft text-info",
  database: "bg-warning-soft text-warning",
  container: "bg-accent-soft text-accent",
  network: "bg-success-soft text-success",
  external: "bg-edge text-muted",
}

export default function KnowledgeGraphPage() {
  // stands in for GET /v1/knowledge-graph/cmdb/query
  const { data: graph } = useQuery({ queryKey: ["cmdb"], queryFn: async () => demoCmdbGraph() })
  const [query, setQuery] = React.useState("")
  const [type, setType] = React.useState<string>("all")

  const results = React.useMemo(() => {
    if (!graph) return []
    const q = query.toLowerCase().trim()
    return graph.nodes.filter(
      (n) => (type === "all" || n.type === type) && (!q || n.label.toLowerCase().includes(q))
    )
  }, [graph, query, type])

  const degree = React.useMemo(() => {
    const d = new Map<string, number>()
    for (const e of graph?.edges ?? []) {
      d.set(e.source, (d.get(e.source) ?? 0) + 1)
      d.set(e.target, (d.get(e.target) ?? 0) + 1)
    }
    return d
  }, [graph])

  return (
    <PageEnter>
      <PageHeader
        title="Knowledge Graph"
        subtitle="Query the CMDB — every service, container, and database with its dependency degree."
      />

      {/* Type breakdown */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Object.entries(graph?.totals.types ?? {}).map(([t, count], i) => (
          <motion.div
            key={t}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold tabular-nums">
                <CountUp value={count} />
              </p>
              <Badge className={`mt-1.5 ${TYPE_BADGE[t]}`}>{t}</Badge>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card lift={false} className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search nodes by name…"
            aria-label="Search CMDB nodes"
            className="h-10 flex-1 rounded-lg border border-edge bg-surface px-3 text-sm outline-none placeholder:text-muted-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by type"
            className="h-10 rounded-lg border border-edge bg-surface px-3 text-sm outline-none focus:border-accent"
          >
            <option value="all">All types</option>
            {Object.keys(graph?.totals.types ?? {}).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {!graph ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No nodes match"
            description="Try a broader search term or a different type filter — the CMDB indexes every container, service, and database on the platform."
          />
        ) : (
          <ul className="mt-4 divide-y divide-edge">
            {results.map((n) => (
              <li key={n.id} className="flex items-center gap-3 py-3">
                <Layers className="size-4 shrink-0 text-accent" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-sm">{n.label}</p>
                  <p className="text-xs text-muted">
                    degree {degree.get(n.id) ?? 0}
                    {n.critical && " · critical path"}
                  </p>
                </div>
                <Badge className={TYPE_BADGE[n.type]}>{n.type}</Badge>
                {n.critical && <Badge className="bg-danger-soft text-danger">critical</Badge>}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageEnter>
  )
}

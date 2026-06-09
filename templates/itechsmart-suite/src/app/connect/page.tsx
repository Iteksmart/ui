"use client"

// Integration hub — the UAIO "flavors" model: bring your own tools.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Plug, Puzzle } from "lucide-react"

import { demoConnectors } from "@/lib/demo-suite"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card } from "@/components/ui"

const STATUS: Record<string, { badge: string; label: string }> = {
  active: { badge: "bg-success-soft text-success", label: "active" },
  connected: { badge: "bg-info-soft text-info", label: "connected via MCP" },
  "oauth-pending": { badge: "bg-warning-soft text-warning", label: "OAuth pending" },
  planned: { badge: "bg-edge text-muted", label: "planned" },
}

export default function ConnectPage() {
  const { data: connectors } = useQuery({ queryKey: ["connectors"], queryFn: async () => demoConnectors() })
  const native = connectors?.filter((c) => c.flavor.startsWith("Native")) ?? []
  const flavors = connectors?.filter((c) => !c.flavor.startsWith("Native")) ?? []

  const grid = (items: typeof native, offset: number) => (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c, i) => (
        <motion.div
          key={c.name}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: (offset + i) * 0.04, duration: 0.3, ease: "easeOut" }}
        >
          <Card className="h-full p-5">
            <div className="flex items-start justify-between">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                <Plug className="size-4.5 text-accent" aria-hidden />
              </span>
              <Badge className={STATUS[c.status].badge}>{STATUS[c.status].label}</Badge>
            </div>
            <p className="mt-3 text-sm font-semibold">{c.name}</p>
            <p className="mt-1 text-xs text-muted">{c.flavor}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  )

  return (
    <PageEnter>
      <PageHeader
        title="Connect Hub"
        subtitle="The neurology layer is modular. Native stack always on; client flavors swap in whatever you already run."
      />

      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">Native stack</h2>
        <Badge className="bg-success-soft text-success">always active</Badge>
      </div>
      {grid(native, 0)}

      <div className="flex items-center gap-2 pt-2">
        <h2 className="text-sm font-semibold">Client flavors</h2>
        <Badge className="bg-accent-soft text-accent">
          <Puzzle className="size-3" aria-hidden />
          bring your own tools
        </Badge>
      </div>
      {grid(flavors, native.length)}

      <Card lift={false} className="p-5 text-sm text-muted">
        Monitoring → Datadog replaces Prometheus · Alerting → PagerDuty replaces native alerts ·
        Ticketing → Jira replaces internal ITSM · SIEM → Splunk replaces Wazuh. Same UAIO brain,
        your nervous system.
      </Card>
    </PageEnter>
  )
}

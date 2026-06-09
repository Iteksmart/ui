"use client"

// Workflow management — the n8n + Make automation fleet.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { AlertTriangle, Workflow as WorkflowIcon } from "lucide-react"

import { demoWorkflows } from "@/lib/demo-suite"
import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success-soft text-success",
  inactive: "bg-edge text-muted",
  blocked: "bg-danger-soft text-danger",
  "dry-run": "bg-info-soft text-info",
  warn: "bg-warning-soft text-warning",
}

export default function WorkflowPage() {
  const { data: workflows } = useQuery({ queryKey: ["workflows"], queryFn: async () => demoWorkflows() })

  const counts = {
    total: workflows?.length,
    active: workflows?.filter((w) => w.status === "active").length,
    blocked: workflows?.filter((w) => w.status === "blocked").length,
  }

  return (
    <PageEnter>
      <PageHeader
        title="Workflow Manager"
        subtitle="Every automation in one place — n8n workflows and Make scenarios with honest status, not wishful green."
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total automations", value: counts.total },
          { label: "Active & firing", value: counts.active },
          { label: "Blocked — needs action", value: counts.blocked },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <p className="text-3xl font-bold tabular-nums">
                {s.value === undefined ? <Skeleton className="h-8 w-12" /> : <CountUp value={s.value} />}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {(counts.blocked ?? 0) > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          {counts.blocked} automations blocked — most need a one-time Composio OAuth in the browser.
        </motion.div>
      )}

      <Card lift={false} className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <WorkflowIcon className="size-4 text-accent" aria-hidden />
          Fleet status
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-muted">
                <th className="pb-2 pr-4 font-medium">ID</th>
                <th className="pb-2 pr-4 font-medium">Name</th>
                <th className="pb-2 pr-4 font-medium">Engine</th>
                <th className="pb-2 pr-4 font-medium">Status</th>
                <th className="pb-2 font-medium">Unblock action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {workflows?.map((w) => (
                <tr key={w.id}>
                  <td className="py-3 pr-4 font-mono text-xs text-muted">{w.id}</td>
                  <td className="py-3 pr-4 font-medium">{w.name}</td>
                  <td className="py-3 pr-4">
                    <Badge className={w.engine === "Make" ? "bg-info-soft text-info" : "bg-accent-soft text-accent"}>
                      {w.engine}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    <Badge className={STATUS_BADGE[w.status]}>{w.status}</Badge>
                  </td>
                  <td className="py-3 text-xs text-muted">{w.note || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageEnter>
  )
}

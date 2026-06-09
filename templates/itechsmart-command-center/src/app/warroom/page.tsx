"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, Flame, PartyPopper } from "lucide-react"

import { useIncidents } from "@/lib/api"
import type { Incident } from "@/lib/types"
import { cn, severityStyles, timeAgo } from "@/lib/utils"
import { AgentPipeline, AGENTS } from "@/components/agent-pipeline"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, EmptyState, Skeleton } from "@/components/ui"

function IncidentRow({ incident, flash }: { incident: Incident; flash: boolean }) {
  const resolved = incident.status === "resolved"
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("rounded-xl border border-edge bg-surface p-4", flash && "flash-update")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={severityStyles[incident.severity]}>{incident.severity}</Badge>
        <span className="font-mono text-xs text-muted">{incident.id}</span>
        <span className="text-sm font-medium">{incident.title}</span>
        <span className="ml-auto text-xs text-muted">{timeAgo(incident.startedAt)}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-muted">{incident.service}</span>
          {resolved ? (
            <Badge className="bg-success-soft text-success">
              <CheckCircle2 className="size-3" aria-hidden />
              resolved in {incident.mttrSeconds ? `${Math.floor(incident.mttrSeconds / 60)}m ${incident.mttrSeconds % 60}s` : "—"}
            </Badge>
          ) : (
            <Badge className="bg-warning-soft text-warning">
              {AGENTS[incident.agentStage]?.name} working…
            </Badge>
          )}
        </div>
        <AgentPipeline stage={resolved ? 6 : incident.agentStage} compact />
      </div>
    </motion.li>
  )
}

export default function WarRoomPage() {
  const { data: incidents, isLoading } = useIncidents()
  const [flashIds, setFlashIds] = React.useState<Set<string>>(new Set())
  const prevRef = React.useRef<Map<string, string>>(new Map())

  // Flash rows whose status changed since last poll (SSE-style highlight).
  React.useEffect(() => {
    if (!incidents) return
    const changed = new Set<string>()
    for (const inc of incidents) {
      const prev = prevRef.current.get(inc.id)
      if (prev !== undefined && prev !== `${inc.status}:${inc.agentStage}`) changed.add(inc.id)
      prevRef.current.set(inc.id, `${inc.status}:${inc.agentStage}`)
    }
    if (changed.size > 0) {
      setFlashIds(changed)
      const t = setTimeout(() => setFlashIds(new Set()), 600)
      return () => clearTimeout(t)
    }
  }, [incidents])

  const active = incidents?.filter((i) => i.status !== "resolved") ?? []
  const resolved = incidents?.filter((i) => i.status === "resolved") ?? []

  return (
    <PageEnter>
      <PageHeader
        title="War Room"
        subtitle="Incident command center — AG2 multi-agent remediation in real time."
      />

      {/* Alert banner — slide down 250ms */}
      <AnimatePresence>
        {active.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            role="alert"
            className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
          >
            <Flame className="size-4 shrink-0" aria-hidden />
            {active.length} active incident{active.length > 1 ? "s" : ""} — autonomous remediation in
            progress. Human escalation via Arbiter if SecurityGatekeeper flags risk.
          </motion.div>
        )}
      </AnimatePresence>

      <Card lift={false} className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Live incident feed</h2>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="live-dot size-1.5 rounded-full bg-success" aria-hidden />
            streaming
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : incidents && incidents.length > 0 ? (
          <ul className="space-y-3">
            <AnimatePresence initial={false}>
              {[...active, ...resolved].map((inc) => (
                <IncidentRow key={inc.id} incident={inc} flash={flashIds.has(inc.id)} />
              ))}
            </AnimatePresence>
          </ul>
        ) : (
          <EmptyState
            icon={PartyPopper}
            title="All quiet on the platform"
            description="No incidents detected. The AG2 pipeline is watching 141 containers and will appear here the moment something drifts."
          />
        )}
      </Card>

      <Card lift={false} className="p-5">
        <h2 className="text-sm font-semibold">AG2 GroupChat pipeline</h2>
        <p className="mt-1 text-xs text-muted">
          Every incident flows through six agents — detection to cryptographic notarization. Average
          MTTR: 2.07 minutes.
        </p>
        <div className="mt-4 overflow-x-auto pb-2">
          <AgentPipeline stage={active[0]?.agentStage ?? 6} />
        </div>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted sm:grid-cols-3">
          {AGENTS.map((a, i) => (
            <span key={a.name} className="font-mono">
              {i + 1}. {a.name}
            </span>
          ))}
        </div>
      </Card>
    </PageEnter>
  )
}

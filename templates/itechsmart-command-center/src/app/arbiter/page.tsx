"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "motion/react"
import { Inbox, Network, Scale, UserCheck } from "lucide-react"

import { useArbiterQueue } from "@/lib/api"
import { demoArbiterDecide } from "@/lib/demo"
import type { ArbiterAction } from "@/lib/types"
import { severityStyles, timeAgo } from "@/lib/utils"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card, ConfirmDialog, EmptyState, Skeleton } from "@/components/ui"

function ActionCard({
  action,
  onDecide,
  index,
}: {
  action: ArbiterAction
  onDecide: (id: string, decision: "approved" | "rejected") => void
  index: number
}) {
  const [confirming, setConfirming] = React.useState<"approved" | "rejected" | null>(null)
  const [busy, setBusy] = React.useState(false)

  const decide = (decision: "approved" | "rejected") => {
    setBusy(true)
    setConfirming(null)
    // simulate the API round-trip to POST /api/v1/arbiter/{approve|reject}/:id
    setTimeout(() => {
      onDecide(action.id, decision)
      setBusy(false)
    }, 600)
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
    >
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={severityStyles[action.risk]}>{action.risk} risk</Badge>
          <span className="font-mono text-xs text-muted">{action.id}</span>
          <span className="ml-auto text-xs text-muted">{timeAgo(action.requestedAt)}</span>
        </div>
        <p className="mt-3 text-sm font-semibold">{action.action}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <UserCheck className="size-3.5" aria-hidden />
            {action.requestedBy}
          </span>
          <span className="font-mono">{action.service}</span>
          <span className="flex items-center gap-1.5">
            <Network className="size-3.5" aria-hidden />
            blast radius: {action.blastRadius} node{action.blastRadius === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="success" loading={busy} onClick={() => setConfirming("approved")}>
            Approve
          </Button>
          <Button variant="danger" loading={busy} onClick={() => setConfirming("rejected")}>
            Reject
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={confirming !== null}
        title={confirming === "approved" ? "Approve this action?" : "Reject this action?"}
        description={`${action.action} — blast radius ${action.blastRadius} node(s) on ${action.service}. ${
          confirming === "approved"
            ? "The ExecutionAgent will run it immediately and seal a ProofLink receipt."
            : "The requesting agent will be notified and the action discarded."
        }`}
        confirmLabel={confirming === "approved" ? "Approve & execute" : "Reject action"}
        destructive={confirming === "rejected"}
        onConfirm={() => decide(confirming!)}
        onCancel={() => setConfirming(null)}
      />
    </motion.li>
  )
}

export default function ArbiterPage() {
  const { data: queue, isLoading } = useArbiterQueue()
  const queryClient = useQueryClient()
  const toast = useToast()

  const pending = queue?.filter((a) => a.status === "pending") ?? []
  const decided = queue?.filter((a) => a.status !== "pending") ?? []

  const onDecide = (id: string, decision: "approved" | "rejected") => {
    demoArbiterDecide(id, decision)
    void queryClient.invalidateQueries({ queryKey: ["arbiter-queue"] })
    toast(
      decision === "approved" ? "success" : "error",
      decision === "approved"
        ? `${id} approved — receipt sealed to ProofLink`
        : `${id} rejected — requester notified`
    )
  }

  return (
    <PageEnter>
      <PageHeader
        title="Arbiter"
        subtitle="SEMI_AUTO governance gate — human approval for high-risk autonomous actions."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-accent-soft text-accent">
          <Scale className="size-3" aria-hidden />
          {pending.length} awaiting decision
        </Badge>
        <span className="text-xs text-muted">
          Approvals execute immediately and seal a ProofLink receipt. Rejections notify the requesting
          agent.
        </span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full" />
          ))}
        </div>
      ) : pending.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AnimatePresence>
            {pending.map((a, i) => (
              <ActionCard key={a.id} action={a} index={i} onDecide={onDecide} />
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <Card lift={false}>
          <EmptyState
            icon={Inbox}
            title="Approval queue is clear"
            description="No actions are waiting on a human decision. SEMI_AUTO requests from AG2 and Hermes will appear here in real time."
          />
        </Card>
      )}

      {decided.length > 0 && (
        <Card lift={false} className="p-5">
          <h2 className="mb-3 text-sm font-semibold">Recent decisions</h2>
          <ul className="divide-y divide-edge">
            {decided.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5 text-sm">
                <span className="font-mono text-xs text-muted">{a.id}</span>
                <span className="min-w-0 flex-1 truncate">{a.action}</span>
                <Badge
                  className={
                    a.status === "approved" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                  }
                >
                  {a.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </PageEnter>
  )
}

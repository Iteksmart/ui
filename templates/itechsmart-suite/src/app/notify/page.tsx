"use client"

// Unified notification center — every alert, one feed.
import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Bell, BellOff, CheckCheck } from "lucide-react"

import { demoMarkAllRead, demoMarkRead, demoNotifications } from "@/lib/demo-suite"
import { cn, timeAgo } from "@/lib/utils"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card, EmptyState } from "@/components/ui"

const SEV_DOT: Record<string, string> = {
  info: "bg-info",
  success: "bg-success",
  warning: "bg-warning",
  critical: "bg-danger",
}

export default function NotifyPage() {
  const { data: items } = useQuery({ queryKey: ["notifications"], queryFn: async () => demoNotifications() })
  const queryClient = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = React.useState<"all" | "unread">("all")

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["notifications"] })
  const visible = items?.filter((n) => filter === "all" || !n.read) ?? []
  const unread = items?.filter((n) => !n.read).length ?? 0

  return (
    <PageEnter>
      <PageHeader
        title="Notify"
        subtitle="The unified sender behind /api/v1/notify — Slack, email, and dashboard alerts share this log."
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-accent-soft text-accent">
          <Bell className="size-3" aria-hidden />
          {unread} unread
        </Badge>
        <div className="flex rounded-lg border border-edge bg-surface p-0.5 text-xs">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "btn-press rounded-md px-3 py-1.5 font-medium capitalize",
                filter === f ? "bg-accent text-white" : "text-muted hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          className="ml-auto"
          onClick={() => {
            demoMarkAllRead()
            void refresh()
            toast("success", "All notifications marked read")
          }}
        >
          <CheckCheck className="size-4" aria-hidden />
          Mark all read
        </Button>
      </div>

      <Card lift={false} className="p-3 sm:p-5">
        {visible.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="Inbox zero"
            description="No unread notifications. New platform events — incidents, approvals, bookings, backups — land here in real time."
          />
        ) : (
          <ul className="divide-y divide-edge">
            {visible.map((n, i) => (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
              >
                <button
                  onClick={() => {
                    demoMarkRead(n.id)
                    void refresh()
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl px-2 py-3.5 text-left transition-colors hover:bg-accent-soft/50",
                    n.read && "opacity-60"
                  )}
                >
                  <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", SEV_DOT[n.severity], !n.read && "live-dot")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline gap-2">
                      <span className={cn("text-sm", !n.read && "font-semibold")}>{n.title}</span>
                      <Badge className="bg-accent-soft text-accent">{n.category}</Badge>
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">{n.body}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(n.at)}</span>
                </button>
              </motion.li>
            ))}
          </ul>
        )}
      </Card>
    </PageEnter>
  )
}

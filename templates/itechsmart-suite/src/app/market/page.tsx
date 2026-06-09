"use client"

// AI Marketing Intelligence — campaigns, automation, engagement.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Megaphone, Send, MessageSquareReply, Eye } from "lucide-react"

import { demoCampaigns, demoEngagementSeries } from "@/lib/demo-suite"
import { CountUp } from "@/components/count-up"
import { TrendArea } from "@/components/charts"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

const STATUS_BADGE: Record<string, string> = {
  active: "bg-success-soft text-success",
  paused: "bg-warning-soft text-warning",
  blocked: "bg-danger-soft text-danger",
}

export default function MarketPage() {
  const { data: campaigns } = useQuery({ queryKey: ["campaigns"], queryFn: async () => demoCampaigns() })
  const { data: engagement } = useQuery({
    queryKey: ["engagement"],
    queryFn: async () => demoEngagementSeries(),
  })

  const totals = campaigns?.reduce(
    (acc, c) => ({ sent: acc.sent + c.sent, opened: acc.opened + c.opened, replied: acc.replied + c.replied }),
    { sent: 0, opened: 0, replied: 0 }
  )

  const stats = [
    { icon: Send, label: "Touches delivered", value: totals?.sent },
    { icon: Eye, label: "Opens", value: totals?.opened },
    { icon: MessageSquareReply, label: "Replies", value: totals?.replied },
    { icon: Megaphone, label: "Active engines", value: campaigns?.filter((c) => c.status === "active").length },
  ]

  return (
    <PageEnter>
      <PageHeader
        title="Market Intelligence"
        subtitle="Every outbound engine in one view — Apollo sequences, Make scenarios, and n8n content workflows."
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <s.icon className="size-4.5 text-accent" aria-hidden />
              <p className="mt-3 text-3xl font-bold tabular-nums">
                {s.value === undefined ? <Skeleton className="h-8 w-16" /> : <CountUp value={s.value} />}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card lift={false} className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Engagement — 14 days</h2>
            <p className="text-xs text-muted">Combined impressions across LinkedIn + email</p>
          </div>
          <Badge className="bg-success-soft text-success">trending up</Badge>
        </div>
        {engagement ? (
          <TrendArea data={engagement} color="var(--accent)" />
        ) : (
          <Skeleton className="h-[220px] w-full" />
        )}
      </Card>

      <Card lift={false} className="p-6">
        <h2 className="mb-4 text-sm font-semibold">Campaigns & engines</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-muted">
                <th className="pb-2 pr-4 font-medium">Campaign</th>
                <th className="pb-2 pr-4 font-medium">Channel</th>
                <th className="pb-2 pr-4 font-medium">Sent</th>
                <th className="pb-2 pr-4 font-medium">Opened</th>
                <th className="pb-2 pr-4 font-medium">Replied</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {campaigns?.map((c) => (
                <tr key={c.id}>
                  <td className="py-3 pr-4 font-medium">{c.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs text-muted">{c.channel}</td>
                  <td className="py-3 pr-4 tabular-nums">{c.sent}</td>
                  <td className="py-3 pr-4 tabular-nums">{c.opened}</td>
                  <td className="py-3 pr-4 tabular-nums">{c.replied}</td>
                  <td className="py-3">
                    <Badge className={STATUS_BADGE[c.status]}>{c.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageEnter>
  )
}

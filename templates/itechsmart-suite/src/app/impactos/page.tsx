"use client"

// Business value dashboard — the CFO/executive view.
import { motion } from "motion/react"
import { Banknote, Clock3, Gauge, ShieldCheck } from "lucide-react"

import { useQuery } from "@tanstack/react-query"

import { demoImpact, demoSavingsSeries } from "@/lib/demo-suite"
import { CountUp } from "@/components/count-up"
import { TrendArea } from "@/components/charts"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

export default function ImpactOsPage() {
  const { data: impact } = useQuery({ queryKey: ["impact"], queryFn: async () => demoImpact() })
  const { data: savings } = useQuery({ queryKey: ["savings"], queryFn: async () => demoSavingsSeries() })

  const mttrImprovement = impact ? Math.round((1 - impact.mttrAfterMin / impact.mttrBeforeMin) * 100) : 0

  const cards = [
    { icon: Banknote, label: "Operational dollars saved (12 mo)", value: impact?.dollarsSaved, prefix: "$", badge: "vs manual ops baseline" },
    { icon: Clock3, label: "Engineer hours returned", value: impact?.hoursSaved, badge: "≈ 0.6 FTE-years" },
    { icon: ShieldCheck, label: "Incidents auto-resolved", value: impact?.incidentsAutoResolved, badge: "zero human pages" },
    { icon: Gauge, label: "Autonomy rate", value: impact?.autonomyRate, suffix: "%", decimals: 1, badge: "SEMI_AUTO gated" },
  ]

  return (
    <PageEnter>
      <PageHeader
        title="ImpactOS"
        subtitle="What autonomous operations is worth — in dollars, hours, and incidents that never reached a human."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                <c.icon className="size-4.5 text-accent" aria-hidden />
              </span>
              <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">
                {c.value === undefined ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <>
                    {c.prefix}
                    <CountUp value={c.value} decimals={c.decimals} />
                    {c.suffix}
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">{c.label}</p>
              <Badge className="mt-3 bg-success-soft text-success">{c.badge}</Badge>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* MTTR before/after */}
      <Card lift={false} className="p-6">
        <h2 className="text-sm font-semibold">MTTR — before vs after UAIO</h2>
        <p className="mt-1 text-xs text-muted">
          The pilot promise, measured: detection-to-resolution collapsed from manual paging to a
          six-agent pipeline.
        </p>
        <div className="mt-5 space-y-4">
          {[
            { label: "Before — manual ops", min: impact?.mttrBeforeMin ?? 0, max: 47, color: "var(--danger)" },
            { label: "After — AG2 autonomous", min: impact?.mttrAfterMin ?? 0, max: 47, color: "var(--success)" },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="text-muted">{row.label}</span>
                <span className="font-mono font-semibold tabular-nums">
                  <CountUp value={row.min} decimals={row.min < 10 ? 2 : 0} /> min
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-edge">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(2, (row.min / row.max) * 100)}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: row.color }}
                />
              </div>
            </div>
          ))}
        </div>
        <Badge className="mt-4 bg-success-soft text-success">{mttrImprovement}% faster remediation</Badge>
      </Card>

      <Card lift={false} className="p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold">Cumulative savings</h2>
            <p className="text-xs text-muted">Trailing 12 months, sealed monthly via ProofLink</p>
          </div>
          <Badge className="bg-accent-soft text-accent">impactos.summary</Badge>
        </div>
        {savings ? (
          <TrendArea data={savings} color="var(--success)" />
        ) : (
          <Skeleton className="h-[220px] w-full" />
        )}
      </Card>
    </PageEnter>
  )
}

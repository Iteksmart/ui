"use client"

// Usage metering + billing dashboard (Sprint Task 15B).
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { AlertTriangle, CreditCard, Gauge, Receipt, TrendingUp } from "lucide-react"

import type { MetricPoint } from "@/lib/types"
import { CountUp } from "@/components/count-up"
import { TrendArea } from "@/components/charts"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card, Skeleton } from "@/components/ui"

const PLAN = { name: "Enterprise", price: 2799, actionsLimit: 50000, containersLimit: 100 }

function demoUsageSeries(): MetricPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    return {
      t: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      v: Math.round(1100 + i * 95 + Math.sin(i * 1.3) * 160),
    }
  })
}

const INVOICES = [
  { id: "INV-2026-006", period: "May 2026", amount: 2799, status: "paid" },
  { id: "INV-2026-005", period: "Apr 2026", amount: 2799, status: "paid" },
  { id: "INV-2026-004", period: "Mar 2026", amount: 2799, status: "paid" },
] as const

export default function BillingPage() {
  const toast = useToast()
  const { data: usage } = useQuery({ queryKey: ["usage"], queryFn: async () => demoUsageSeries() })

  const monthActions = 31_240
  const containers = 78
  const dailyRate = usage ? usage[usage.length - 1].v : 0
  const remaining = PLAN.actionsLimit - monthActions
  const daysToLimit = dailyRate > 0 ? Math.floor(remaining / dailyRate) : 99
  const actionsPct = (monthActions / PLAN.actionsLimit) * 100
  const containersPct = (containers / PLAN.containersLimit) * 100
  const costPerIncident = 8.97

  return (
    <PageEnter>
      <PageHeader
        title="Billing"
        subtitle="Every sealed receipt is a metered action — pushed to Stripe Meters on seal, billed transparently."
      />

      {daysToLimit < 14 && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          role="alert"
          className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          At the current rate you will reach your monthly action limit in ~{daysToLimit} days.
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => toast("success", "Stripe Customer Portal would open here")}
          >
            Review plan
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Receipt, label: "Metered actions this month", value: monthActions },
          { icon: Gauge, label: "Daily run rate", value: dailyRate || undefined },
          { icon: CreditCard, label: "Current plan ($/mo)", value: PLAN.price, prefix: "$" },
          { icon: TrendingUp, label: "Cost per incident resolved", value: costPerIncident, prefix: "$", decimals: 2 },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <s.icon className="size-4.5 text-accent" aria-hidden />
              <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight">
                {s.value === undefined ? (
                  <Skeleton className="h-8 w-20" />
                ) : (
                  <>
                    {s.prefix}
                    <CountUp value={s.value} decimals={s.decimals} />
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Usage vs limits */}
      <Card lift={false} className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Usage vs plan limits — {PLAN.name}</h2>
          <Badge className="bg-accent-soft text-accent">{PLAN.name} · ${PLAN.price}/mo</Badge>
        </div>
        <div className="space-y-5">
          {[
            { label: "Metered actions", used: monthActions, limit: PLAN.actionsLimit, pct: actionsPct },
            { label: "Containers monitored", used: containers, limit: PLAN.containersLimit, pct: containersPct },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-baseline justify-between text-sm">
                <span className="text-muted">{row.label}</span>
                <span className="font-mono tabular-nums">
                  {row.used.toLocaleString()} <span className="text-muted">/ {row.limit.toLocaleString()}</span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-edge">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: row.pct > 85 ? "var(--warning)" : "var(--accent)" }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card lift={false} className="p-6">
          <h2 className="mb-3 text-sm font-semibold">Daily metered actions — 14 days</h2>
          {usage ? <TrendArea data={usage} color="var(--accent)" /> : <Skeleton className="h-[220px] w-full" />}
        </Card>

        <Card lift={false} className="p-6">
          <h2 className="mb-4 text-sm font-semibold">Invoice history</h2>
          <ul className="divide-y divide-edge">
            {INVOICES.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 py-3.5 text-sm">
                <span className="font-mono text-xs text-muted">{inv.id}</span>
                <span className="flex-1">{inv.period}</span>
                <span className="font-mono tabular-nums">${inv.amount.toLocaleString()}</span>
                <Badge className="bg-success-soft text-success">{inv.status}</Badge>
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-edge bg-surface p-4 text-xs text-muted sm:grid-cols-4">
            <span>Trial · $0</span>
            <span>MSP · $699</span>
            <span className="font-semibold text-accent">Enterprise · $2,799</span>
            <span>Gov · $7,999</span>
          </div>
        </Card>
      </div>
    </PageEnter>
  )
}

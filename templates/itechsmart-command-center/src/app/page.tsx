"use client"

import { motion } from "motion/react"
import {
  Boxes,
  Database,
  Globe,
  ShieldCheck,
  Timer,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import {
  useBookings,
  useFunnel,
  useLedgerStats,
  useMttrSeries,
  usePlatformStatus,
  useReceiptSeries,
} from "@/lib/api"
import { demoSparkline } from "@/lib/demo"
import { timeAgo } from "@/lib/utils"
import { CountUp } from "@/components/count-up"
import { FunnelBars, Sparkline, TrendArea } from "@/components/charts"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

const stagger = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
}

function MetricCard({
  index,
  icon: Icon,
  label,
  value,
  decimals,
  suffix,
  trend,
  spark,
  sparkColor,
}: {
  index: number
  icon: typeof Boxes
  label: string
  value: number | undefined
  decimals?: number
  suffix?: string
  trend?: { up: boolean; label: string; good: boolean }
  spark?: number[]
  sparkColor?: string
}) {
  return (
    <motion.div custom={index} initial="hidden" animate="show" variants={stagger}>
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
            <Icon className="size-4.5 text-accent" aria-hidden />
          </span>
          {trend && (
            <Badge className={trend.good ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}>
              {trend.up ? (
                <TrendingUp className="size-3" aria-hidden />
              ) : (
                <TrendingDown className="size-3" aria-hidden />
              )}
              {trend.label}
            </Badge>
          )}
        </div>
        <div className="mt-4">
          {value === undefined ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-3xl font-bold tabular-nums tracking-tight">
              <CountUp value={value} decimals={decimals} />
              {suffix && <span className="ml-1 text-base font-medium text-muted">{suffix}</span>}
            </p>
          )}
          <p className="mt-1 text-sm text-muted">{label}</p>
        </div>
        {spark && (
          <div className="mt-3">
            <Sparkline data={spark} color={sparkColor ?? "var(--accent)"} />
          </div>
        )}
      </Card>
    </motion.div>
  )
}

const statusStyles: Record<string, string> = {
  new: "bg-info-soft text-info",
  reviewing: "bg-warning-soft text-warning",
  qualified: "bg-accent-soft text-accent",
  pilot: "bg-success-soft text-success",
  customer: "bg-success-soft text-success",
}

export default function OverviewPage() {
  const { data: status } = usePlatformStatus()
  const { data: ledger } = useLedgerStats()
  const { data: mttrSeries } = useMttrSeries()
  const { data: receiptSeries } = useReceiptSeries()
  const { data: funnel } = useFunnel()
  const { data: bookings, isLoading: bookingsLoading } = useBookings()

  return (
    <PageEnter>
      <PageHeader
        title="Platform Overview"
        subtitle="Live health, audit ledger, and go-to-market signal for the UAIO platform."
      />

      {/* Metric cards — stagger reveal 50ms per card */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          icon={ShieldCheck}
          label="ProofLink receipts sealed"
          value={ledger?.receipts}
          trend={{ up: true, label: `+${ledger?.sealedToday ?? "—"} today`, good: true }}
          spark={demoSparkline(180, 30)}
          sparkColor="var(--success)"
        />
        <MetricCard
          index={1}
          icon={Timer}
          label="Mean time to remediate"
          value={status?.mttrMinutes}
          decimals={2}
          suffix="min"
          trend={{ up: false, label: "−55% vs 14d", good: true }}
          spark={demoSparkline(4, 1.2).map((v, i, a) => a[0] * 1.4 - v * 0.4 + (a.length - i) * 0.05)}
          sparkColor="var(--info)"
        />
        <MetricCard
          index={2}
          icon={Boxes}
          label="Containers healthy"
          value={status?.containers}
          trend={{ up: true, label: "141/141", good: true }}
          spark={demoSparkline(140, 0.8)}
          sparkColor="var(--accent)"
        />
        <MetricCard
          index={3}
          icon={Globe}
          label="Autonomy rate"
          value={status?.autonomyRate}
          decimals={1}
          suffix="%"
          trend={{ up: true, label: "+2.1 pts", good: true }}
          spark={demoSparkline(93, 1.4)}
          sparkColor="var(--warning)"
        />
      </div>

      {/* Trend charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">MTTR — 14 days</h2>
              <p className="text-xs text-muted">Minutes per incident, AG2 autonomous remediation</p>
            </div>
            <Badge className="bg-info-soft text-info">2.07 min avg</Badge>
          </div>
          {mttrSeries ? (
            <TrendArea data={mttrSeries} color="var(--info)" unit=" min" />
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Receipts sealed — cumulative</h2>
              <p className="text-xs text-muted">Cryptographic audit ledger growth</p>
            </div>
            <Badge className="bg-success-soft text-success">0 chain breaks</Badge>
          </div>
          {receiptSeries ? (
            <TrendArea data={receiptSeries} color="var(--success)" />
          ) : (
            <Skeleton className="h-[220px] w-full" />
          )}
        </Card>
      </div>

      {/* Funnel + bookings */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Sales funnel</h2>
            <p className="text-xs text-muted">Apollo outreach → Calendly pilots → customers</p>
          </div>
          {funnel ? <FunnelBars data={funnel} /> : <Skeleton className="h-[220px] w-full" />}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Pilot pipeline</h2>
              <p className="text-xs text-muted">Latest Calendly bookings</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted">
              <Database className="size-3.5" aria-hidden />
              pilot_bookings
            </span>
          </div>
          {bookingsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-edge">
              {bookings?.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent">
                    {b.name.slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{b.company}</p>
                    <p className="text-xs text-muted">
                      {b.name} · {b.tier} · {timeAgo(b.bookedAt)}
                    </p>
                  </div>
                  <Badge className={statusStyles[b.status]}>{b.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageEnter>
  )
}

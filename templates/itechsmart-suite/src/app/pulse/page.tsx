"use client"

// Pulse Scanner — continuous health scan across the platform's public surface.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Radar, ShieldCheck, Timer, Wifi } from "lucide-react"

import { demoPulse } from "@/lib/demo-suite"
import { cn } from "@/lib/utils"
import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

const STATE_BADGE: Record<string, string> = {
  healthy: "bg-success-soft text-success",
  warn: "bg-warning-soft text-warning",
  down: "bg-danger-soft text-danger",
}

export default function PulsePage() {
  const { data: targets } = useQuery({
    queryKey: ["pulse"],
    queryFn: async () => demoPulse(),
    refetchInterval: 10000,
  })

  const healthy = targets?.filter((t) => t.state === "healthy").length ?? 0
  const avgLatency = targets?.length
    ? Math.round(targets.reduce((a, t) => a + t.latencyMs, 0) / targets.length)
    : 0

  const stats = [
    { icon: Radar, label: "Endpoints scanned", value: targets?.length },
    { icon: Wifi, label: "Healthy", value: targets ? healthy : undefined },
    { icon: Timer, label: "Avg latency (ms)", value: targets ? avgLatency : undefined },
    { icon: ShieldCheck, label: "Valid SSL certs", value: targets?.filter((t) => t.ssl === "valid").length },
  ]

  return (
    <PageEnter>
      <PageHeader
        title="Pulse Scanner"
        subtitle="Every public endpoint, probed continuously — HTTP status, latency, and certificate health."
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
                {s.value === undefined ? <Skeleton className="h-8 w-14" /> : <CountUp value={s.value} />}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card lift={false} className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Scan results</h2>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="live-dot size-1.5 rounded-full bg-success" aria-hidden />
            re-scanning every 10s
          </span>
        </div>
        {!targets ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-edge">
            {targets.map((t) => (
              <li key={t.host} className="flex flex-wrap items-center gap-3 py-3">
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    t.state === "healthy" ? "bg-success live-dot" : t.state === "warn" ? "bg-warning" : "bg-danger"
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate font-mono text-sm">{t.host}</span>
                <span className="font-mono text-xs tabular-nums text-muted">{t.latencyMs}ms</span>
                <Badge
                  className={t.http === 200 ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}
                >
                  HTTP {t.http}
                </Badge>
                <Badge
                  className={
                    t.ssl === "valid"
                      ? "bg-success-soft text-success"
                      : t.ssl === "expiring"
                        ? "bg-warning-soft text-warning"
                        : "bg-danger-soft text-danger"
                  }
                >
                  SSL {t.ssl}
                </Badge>
                <Badge className={STATE_BADGE[t.state]}>{t.state}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </PageEnter>
  )
}

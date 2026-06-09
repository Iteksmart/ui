"use client"

// RPA dashboard — robot fleet health.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Bot, Cpu } from "lucide-react"

import { demoBots } from "@/lib/demo-suite"
import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

export default function RpaPage() {
  const { data: bots } = useQuery({ queryKey: ["bots"], queryFn: async () => demoBots() })

  const totalRuns = bots?.reduce((a, b) => a + b.runs, 0)
  const avgSuccess = bots?.length
    ? bots.reduce((a, b) => a + b.success, 0) / bots.length
    : undefined

  return (
    <PageEnter>
      <PageHeader
        title="RPA Dashboard"
        subtitle="The robot fleet — runs, success rates, queue depth. Every bot run seals a receipt."
      />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Bots in fleet", value: bots?.length, decimals: 0 },
          { label: "Total runs", value: totalRuns, decimals: 0 },
          { label: "Avg success rate", value: avgSuccess, decimals: 1, suffix: "%" },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <p className="text-3xl font-bold tabular-nums">
                {s.value === undefined ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <CountUp value={s.value} decimals={s.decimals} />
                    {s.suffix}
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bots?.map((bot, i) => (
          <motion.div
            key={bot.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                  <Bot className="size-4.5 text-accent" aria-hidden />
                </span>
                <Badge
                  className={
                    bot.state === "running"
                      ? "pulse-operational bg-success-soft text-success"
                      : "bg-edge text-muted"
                  }
                >
                  {bot.state}
                </Badge>
              </div>
              <p className="mt-3 font-mono text-sm font-semibold">{bot.name}</p>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[11px] text-muted">runs</dt>
                  <dd className="text-sm font-semibold tabular-nums">{bot.runs.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">success</dt>
                  <dd className="text-sm font-semibold tabular-nums">{bot.success}%</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted">queue</dt>
                  <dd className="text-sm font-semibold tabular-nums">{bot.queue}</dd>
                </div>
              </dl>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-edge">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${bot.success}%` }}
                  transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 + i * 0.05 }}
                  className="h-full rounded-full bg-success"
                />
              </div>
            </Card>
          </motion.div>
        ))}
        {!bots && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </>
        )}
      </div>

      <Card lift={false} className="flex items-center gap-3 p-5 text-sm text-muted">
        <Cpu className="size-4 shrink-0 text-accent" aria-hidden />
        AgentArmy provider: <span className="font-mono">DEFAULT_PROVIDER=mock</span> — OctoAI cutover
        pending smoke-test approval (POST /api/agentarmy/v1/admin/smoke-provider).
      </Card>
    </PageEnter>
  )
}

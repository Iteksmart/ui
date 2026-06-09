"use client"

// UAIO certification — Bronze → Silver → Gold progression.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Award, CheckCircle2, Circle, Trophy } from "lucide-react"

import { demoCertification } from "@/lib/demo-suite"
import { cn } from "@/lib/utils"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card, Skeleton } from "@/components/ui"

const TIERS = [
  { tier: "bronze", label: "Bronze", color: "#b45309", desc: "Foundations — health checks, receipts, rollback" },
  { tier: "silver", label: "Silver", color: "#94a3b8", desc: "Autonomy — MTTR < 15 min, twin-gated changes" },
  { tier: "gold", label: "Gold", color: "#d4a017", desc: "Excellence — MTTR < 5 min, 95%+ autonomy" },
] as const

export default function CertificationPage() {
  // stands in for GET /api/v1/uaio-certification/status
  const { data: cert } = useQuery({ queryKey: ["cert"], queryFn: async () => demoCertification() })

  const progressFor = (tier: string) => {
    const items = cert?.criteria.filter((c) => c.tier === tier) ?? []
    const done = items.filter((c) => c.done).length
    return { done, total: items.length, pct: items.length ? (done / items.length) * 100 : 0 }
  }

  return (
    <PageEnter>
      <PageHeader
        title="UAIO Certification"
        subtitle="Unified Autonomous IT Operations — an auditable maturity ladder, every criterion backed by a ProofLink receipt."
      />

      {/* Current standing */}
      <Card lift={false} className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-its-purple to-its-purple-light text-white shadow-lg"
        >
          <Trophy className="size-8" aria-hidden />
        </motion.span>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-muted">Current certification</p>
          <p className="mt-0.5 text-2xl font-bold">
            {cert ? `UAIO ${cert.current}` : <Skeleton className="h-8 w-32" />}
          </p>
          <p className="mt-1 text-sm text-muted">
            Next: <span className="font-medium text-foreground">{cert?.next}</span> — 1 of 3 gold
            criteria remaining in flight
          </p>
        </div>
        <Badge className="pulse-operational bg-success-soft text-success">audit-verified</Badge>
      </Card>

      {/* Tier progression */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {TIERS.map((t, i) => {
          const p = progressFor(t.tier)
          const complete = p.done === p.total && p.total > 0
          return (
            <motion.div
              key={t.tier}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              <Card className={cn("h-full p-5", complete && "border-success/40")}>
                <div className="flex items-center gap-2.5">
                  <Award className="size-5" style={{ color: t.color }} aria-hidden />
                  <p className="text-sm font-semibold">{t.label}</p>
                  <span className="ml-auto font-mono text-xs text-muted">
                    {p.done}/{p.total}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted">{t.desc}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-edge">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${p.pct}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 + i * 0.05 }}
                    className="h-full rounded-full"
                    style={{ background: complete ? "var(--success)" : t.color }}
                  />
                </div>
                <ul className="mt-4 space-y-2.5">
                  {cert?.criteria
                    .filter((c) => c.tier === t.tier)
                    .map((c) => (
                      <li key={c.name} className="flex items-start gap-2 text-sm">
                        {c.done ? (
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                        ) : (
                          <Circle className="mt-0.5 size-4 shrink-0 text-muted-faint" aria-hidden />
                        )}
                        <span className={cn(!c.done && "text-muted")}>{c.name}</span>
                      </li>
                    ))}
                </ul>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </PageEnter>
  )
}

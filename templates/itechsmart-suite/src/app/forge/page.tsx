"use client"

// Forge — build pipeline with stages and deploy receipts.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { CheckCircle2, Hammer, XCircle } from "lucide-react"

import { demoBuilds } from "@/lib/demo-suite"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card } from "@/components/ui"

const STAGES = ["lint", "typecheck", "tests", "build", "staged (temp port)", "deployed"] as const

export default function ForgePage() {
  const { data: builds } = useQuery({ queryKey: ["builds"], queryFn: async () => demoBuilds() })

  return (
    <PageEnter>
      <PageHeader
        title="Forge"
        subtitle="The build pipeline — worktree → temp port → promote.sh → main. Every deploy seals a receipt; nothing skips staging."
      />

      <Card lift={false} className="p-6">
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold">
          <Hammer className="size-4 text-accent" aria-hidden />
          Pipeline stages
        </h2>
        <p className="mb-4 text-xs text-muted">
          Standing rule: test on a temp port first, reload nginx — never restart it.
        </p>
        <ol className="flex flex-wrap items-center gap-2">
          {STAGES.map((stage, i) => (
            <motion.li
              key={stage}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.3, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <span className="rounded-full border border-edge bg-surface px-3 py-1.5 font-mono text-xs">
                {stage}
              </span>
              {i < STAGES.length - 1 && <span className="h-px w-3 bg-edge-strong" aria-hidden />}
            </motion.li>
          ))}
        </ol>
      </Card>

      <Card lift={false} className="p-6">
        <h2 className="mb-4 text-sm font-semibold">Recent builds</h2>
        <ul className="divide-y divide-edge">
          {builds?.map((b, i) => (
            <motion.li
              key={b.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
              className="flex flex-wrap items-center gap-3 py-3.5"
            >
              {b.ok ? (
                <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
              ) : (
                <XCircle className="size-4 shrink-0 text-danger" aria-hidden />
              )}
              <span className="font-mono text-xs text-muted">{b.id}</span>
              <span className="min-w-0 flex-1 font-mono text-sm font-medium">{b.target}</span>
              <span className="font-mono text-xs tabular-nums text-muted">{b.duration}</span>
              <Badge className={b.ok ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}>
                {b.stage}
              </Badge>
            </motion.li>
          ))}
        </ul>
      </Card>
    </PageEnter>
  )
}

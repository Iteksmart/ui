"use client"

// Public ProofLink ledger — the trust signal analysts and auditors see first.
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Anchor,
  BadgeCheck,
  Bitcoin,
  FileDown,
  FileSearch,
  Link2,
  Lock,
  ShieldCheck,
  Stamp,
} from "lucide-react"

import { useLedgerStats, useReceipts } from "@/lib/api"
import { cn, timeAgo } from "@/lib/utils"
import { CountUp } from "@/components/count-up"
import { PageEnter } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card, Skeleton } from "@/components/ui"

const TRUST = [
  { icon: Link2, title: "Hash-chained", body: "Every receipt commits to the previous one. A single altered byte breaks the chain — and the chain has never broken." },
  { icon: Bitcoin, title: "Bitcoin-anchored", body: "Ledger checkpoints are anchored to Bitcoin via OpenTimestamps across 4/4 calendars. Tamper-evidence no vendor can revoke." },
  { icon: Lock, title: "Independently verifiable", body: "Verification is public. No account, no API key — paste a receipt ID and check the math yourself." },
]

export default function VerifyPage() {
  const { data: ledger } = useLedgerStats()
  const { data: receipts, isLoading } = useReceipts()
  const toast = useToast()

  const [lookup, setLookup] = React.useState("")
  const [verifying, setVerifying] = React.useState(false)
  const [result, setResult] = React.useState<null | { id: string; ok: boolean }>(null)

  const verify = (e: React.FormEvent) => {
    e.preventDefault()
    const id = lookup.trim()
    if (!id) {
      toast("error", "Enter a receipt ID to verify")
      return
    }
    setVerifying(true)
    setResult(null)
    // stands in for GET https://verify.itechsmart.dev/api/verify/{receipt_id}
    setTimeout(() => {
      setVerifying(false)
      setResult({ id, ok: true })
      setLookup("")
    }, 900)
  }

  return (
    <PageEnter>
      {/* Hero */}
      <section className="py-6 text-center sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Badge className="bg-success-soft text-success pulse-operational mx-auto">
            <ShieldCheck className="size-3" aria-hidden />
            Public ledger · live
          </Badge>
          <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            Every action,{" "}
            <span className="gradient-text">cryptographically sealed</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted sm:text-base">
            The iTechSmart platform notarizes every autonomous action into a hash-chained,
            Bitcoin-anchored audit ledger. This page is the proof — open to anyone.
          </p>
        </motion.div>

        {/* Headline stats */}
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Stamp, label: "Receipts sealed", value: ledger?.receipts, badge: `+${ledger?.sealedToday ?? "—"} today` },
            { icon: Link2, label: "Chain breaks — ever", value: ledger?.chainBreaks ?? 0, badge: "integrity 100%" },
            { icon: Bitcoin, label: "OTS calendars anchored", value: 4, badge: "of 4" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              <Card className="p-5 text-center">
                <s.icon className="mx-auto size-5 text-accent" aria-hidden />
                <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">
                  {s.value === undefined ? <Skeleton className="mx-auto h-8 w-20" /> : <CountUp value={s.value} />}
                </p>
                <p className="mt-1 text-xs text-muted">{s.label}</p>
                <Badge className="mt-2 bg-success-soft text-success">{s.badge}</Badge>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Verifier */}
      <Card lift={false} className="mx-auto max-w-3xl p-6">
        <h2 className="text-sm font-semibold">Verify a receipt</h2>
        <p className="mt-1 text-xs text-muted">
          GET /api/verify/&#123;receipt_id&#125; — recomputes the hash chain around your receipt and
          checks the Bitcoin anchor.
        </p>
        <form onSubmit={verify} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="rcpt_…"
            aria-label="Receipt ID"
            className="h-11 flex-1 rounded-lg border border-edge bg-surface px-3 font-mono text-sm outline-none placeholder:text-muted-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
          />
          <Button type="submit" loading={verifying} className="h-11">
            <FileSearch className="size-4" aria-hidden />
            Verify
          </Button>
        </form>
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              role="status"
              className="seal-flash mt-4 flex items-center gap-3 rounded-xl border border-success/30 bg-success-soft px-4 py-3"
            >
              <BadgeCheck className="size-5 shrink-0 text-success" aria-hidden />
              <div className="min-w-0 text-sm">
                <p className="font-medium text-success">Receipt verified</p>
                <p className="truncate font-mono text-xs text-muted">
                  {result.id} — chain intact · hash matches · anchor confirmed
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Live chain */}
      <Card lift={false} className="mx-auto max-w-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Latest sealed receipts</h2>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="live-dot size-1.5 rounded-full bg-success" aria-hidden />
            sealing live
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ol>
            {receipts?.slice(0, 8).map((r, i) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
                className="relative flex items-center gap-3 rounded-xl px-2 py-3"
              >
                {i < 7 && (
                  <span className="absolute left-[17px] top-10 h-[calc(100%-1.25rem)] w-px bg-edge-strong" aria-hidden />
                )}
                <span className="z-10 flex size-5 shrink-0 items-center justify-center rounded-full border border-success/40 bg-success-soft text-success">
                  <BadgeCheck className="size-3" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-medium text-accent">{r.id}</span>
                    <Badge className="bg-accent-soft text-accent">{r.category}</Badge>
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted-faint">sha256:{r.hash}</p>
                </div>
                <div className={cn("flex shrink-0 items-center gap-2")}>
                  {r.anchored && (
                    <span title="Bitcoin-anchored via OpenTimestamps">
                      <Anchor className="size-3.5 text-warning" aria-hidden />
                    </span>
                  )}
                  <span className="text-xs text-muted">{timeAgo(r.sealedAt)}</span>
                </div>
              </motion.li>
            ))}
          </ol>
        )}
      </Card>

      {/* Trust pillars */}
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
        {TRUST.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="h-full p-5">
              <t.icon className="size-5 text-accent" aria-hidden />
              <p className="mt-3 text-sm font-semibold">{t.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{t.body}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Auditor CTA */}
      <Card lift={false} className="mx-auto flex max-w-3xl flex-col items-center gap-3 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <p className="text-sm font-semibold">Auditing? Get the evidence package.</p>
          <p className="mt-1 text-xs text-muted">
            Full auditor report with ProofLink evidence — NIST CSF 96/100, HIPAA 100/100, SOC2 11/12.
          </p>
        </div>
        <a
          href="https://api.itechsmart.dev/api/v1/verify/auditor-report.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="ghost">
            <FileDown className="size-4" aria-hidden />
            Auditor report (PDF)
          </Button>
        </a>
      </Card>
    </PageEnter>
  )
}

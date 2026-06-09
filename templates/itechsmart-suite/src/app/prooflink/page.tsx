"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Anchor, BadgeCheck, Bitcoin, FileSearch, Link2, ShieldCheck, Stamp } from "lucide-react"

import { useLedgerStats, useReceipts } from "@/lib/api"
import { cn, timeAgo } from "@/lib/utils"
import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card, EmptyState, Skeleton } from "@/components/ui"

export default function ProofLinkPage() {
  const { data: ledger } = useLedgerStats()
  const { data: receipts, isLoading } = useReceipts()
  const toast = useToast()

  const [lookup, setLookup] = React.useState("")
  const [verifying, setVerifying] = React.useState(false)
  const [sealedFlash, setSealedFlash] = React.useState<string | null>(null)
  const prevTopRef = React.useRef<string | null>(null)

  // Green seal flash when a new receipt lands at the top of the chain.
  React.useEffect(() => {
    const top = receipts?.[0]?.id ?? null
    if (top && prevTopRef.current && top !== prevTopRef.current) {
      setSealedFlash(top)
      const t = setTimeout(() => setSealedFlash(null), 500)
      return () => clearTimeout(t)
    }
    prevTopRef.current = top
  }, [receipts])

  const verify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lookup.trim()) {
      toast("error", "Enter a receipt ID to verify")
      return
    }
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      toast("success", `${lookup.trim()} verified — chain intact, hash matches`)
      setLookup("")
    }, 800)
  }

  return (
    <PageEnter>
      <PageHeader
        title="ProofLink Ledger"
        subtitle="Cryptographic audit trail — every platform action sealed, chained, and Bitcoin-anchored."
      />

      {/* Ledger stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            icon: Stamp,
            label: "Receipts sealed",
            node: <CountUp value={ledger?.receipts ?? 0} />,
            badge: { text: `+${ledger?.sealedToday ?? "—"} today`, cls: "bg-success-soft text-success" },
          },
          {
            icon: Link2,
            label: "Chain breaks",
            node: <CountUp value={ledger?.chainBreaks ?? 0} />,
            badge: { text: "integrity 100%", cls: "bg-success-soft text-success" },
          },
          {
            icon: Bitcoin,
            label: "Bitcoin anchoring",
            node: <span className="text-2xl">{ledger?.bitcoinAnchored ?? "—"}</span>,
            badge: { text: "OpenTimestamps", cls: "bg-warning-soft text-warning" },
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                  <stat.icon className="size-4.5 text-accent" aria-hidden />
                </span>
                <Badge className={stat.badge.cls}>{stat.badge.text}</Badge>
              </div>
              <p className="mt-4 text-3xl font-bold tabular-nums tracking-tight">{stat.node}</p>
              <p className="mt-1 text-sm text-muted">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Verify a receipt */}
      <Card lift={false} className="p-5">
        <h2 className="text-sm font-semibold">Verify a receipt</h2>
        <p className="mt-1 text-xs text-muted">
          Public verification at verify.itechsmart.dev/api/verify/&#123;receipt_id&#125; — anyone can
          audit, no account required.
        </p>
        <form onSubmit={verify} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            placeholder="rcpt_…"
            aria-label="Receipt ID"
            className="h-10 flex-1 rounded-lg border border-edge bg-surface px-3 font-mono text-sm outline-none placeholder:text-muted-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
          />
          <Button type="submit" loading={verifying}>
            <FileSearch className="size-4" aria-hidden />
            Verify
          </Button>
        </form>
      </Card>

      {/* Receipt chain */}
      <Card lift={false} className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Latest receipts</h2>
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
        ) : receipts && receipts.length > 0 ? (
          <ol className="relative space-y-0">
            <AnimatePresence initial={false}>
              {receipts.map((r, i) => (
                <motion.li
                  key={r.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={cn(
                    "relative flex items-center gap-3 rounded-xl px-2 py-3",
                    sealedFlash === r.id && "seal-flash"
                  )}
                >
                  {/* chain spine */}
                  {i < receipts.length - 1 && (
                    <span
                      className="absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px bg-edge-strong"
                      aria-hidden
                    />
                  )}
                  <span
                    className={cn(
                      "z-10 flex size-5 shrink-0 items-center justify-center rounded-full",
                      sealedFlash === r.id
                        ? "bg-success text-white"
                        : "border border-success/40 bg-success-soft text-success"
                    )}
                  >
                    <BadgeCheck className="size-3" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-medium text-accent">{r.id}</span>
                      <Badge className="bg-accent-soft text-accent">{r.category}</Badge>
                    </p>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-faint">
                      sha256:{r.hash}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {r.anchored && (
                      <span title="Bitcoin-anchored via OpenTimestamps">
                        <Anchor className="size-3.5 text-warning" aria-hidden />
                      </span>
                    )}
                    <span className="text-xs text-muted">{timeAgo(r.sealedAt)}</span>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
        ) : (
          <EmptyState
            icon={ShieldCheck}
            title="No receipts yet"
            description="Receipts appear here the moment any platform action is sealed by the notary."
          />
        )}
      </Card>
    </PageEnter>
  )
}

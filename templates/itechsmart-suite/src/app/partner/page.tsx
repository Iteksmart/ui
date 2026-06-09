"use client"

// Partner/reseller portal — MSP multi-client console (Sprint Task 14).
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { AlertTriangle, Banknote, Building2, FileDown, Handshake, ShieldCheck } from "lucide-react"

import { cn } from "@/lib/utils"
import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card, Skeleton } from "@/components/ui"

type ClientTenant = {
  name: string
  slug: string
  health: "healthy" | "warn"
  receipts: number
  mttrMin: number
  incidents30d: number
  mrr: number
}

function demoClients(): ClientTenant[] {
  return [
    { name: "Halcyon Health", slug: "halcyon", health: "healthy", receipts: 4120, mttrMin: 2.4, incidents30d: 14, mrr: 2799 },
    { name: "Brightline Logistics", slug: "brightline", health: "healthy", receipts: 2870, mttrMin: 1.9, incidents30d: 8, mrr: 2799 },
    { name: "Parkside IT", slug: "parkside", health: "warn", receipts: 1240, mttrMin: 3.1, incidents30d: 21, mrr: 699 },
    { name: "Meridian Claims", slug: "meridian", health: "healthy", receipts: 980, mttrMin: 2.2, incidents30d: 5, mrr: 699 },
    { name: "Cobalt Federal", slug: "cobalt", health: "healthy", receipts: 3310, mttrMin: 2.0, incidents30d: 11, mrr: 7999 },
  ]
}

const REV_SHARE = 0.3

export default function PartnerPage() {
  const toast = useToast()
  const { data: clients } = useQuery({ queryKey: ["partner-clients"], queryFn: async () => demoClients() })

  const totalMrr = clients?.reduce((a, c) => a + c.mrr, 0) ?? 0
  const partnerCut = Math.round(totalMrr * REV_SHARE)
  const correlated = clients?.filter((c) => c.health === "warn").length ?? 0

  return (
    <PageEnter>
      <PageHeader
        title="Partner Portal"
        subtitle="Every client tenant in one grid — white-labeled dashboards, monthly evidence packs, 30% revenue share."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { icon: Building2, label: "Managed client tenants", value: clients?.length },
          { icon: Banknote, label: "Your monthly share (30%)", value: clients ? partnerCut : undefined, prefix: "$" },
          { icon: ShieldCheck, label: "Client receipts sealed", value: clients?.reduce((a, c) => a + c.receipts, 0) },
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
                    <CountUp value={s.value} />
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-muted">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {correlated > 1 && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning"
        >
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Cross-client correlation: {correlated} tenants showing the same degradation pattern —
          investigate once, fix everywhere.
        </div>
      )}

      <Card lift={false} className="p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Handshake className="size-4 text-accent" aria-hidden />
            Client tenants
          </h2>
          <Button
            variant="ghost"
            className="ml-auto"
            onClick={() => toast("success", "Monthly evidence pack generating for all 5 clients — receipt sealed")}
          >
            <FileDown className="size-4" aria-hidden />
            Bulk evidence pack
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients?.map((c, i) => (
            <motion.div
              key={c.slug}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              <Card className="p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-sm font-bold text-accent">
                    {c.name.slice(0, 1)}
                  </span>
                  <Badge
                    className={cn(
                      c.health === "healthy"
                        ? "pulse-operational bg-success-soft text-success"
                        : "bg-warning-soft text-warning"
                    )}
                  >
                    {c.health}
                  </Badge>
                </div>
                <p className="mt-3 text-sm font-semibold">{c.name}</p>
                <p className="font-mono text-[11px] text-muted-faint">verify.itechsmart.dev?tenant={c.slug}</p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <dt className="text-[11px] text-muted">receipts</dt>
                    <dd className="text-sm font-semibold tabular-nums">{c.receipts.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">MTTR</dt>
                    <dd className="text-sm font-semibold tabular-nums">{c.mttrMin}m</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">inc/30d</dt>
                    <dd className="text-sm font-semibold tabular-nums">{c.incidents30d}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between border-t border-edge pt-3 text-xs">
                  <span className="text-muted">MRR ${c.mrr.toLocaleString()}</span>
                  <span className="font-semibold text-success">you earn ${Math.round(c.mrr * REV_SHARE)}</span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>

      <Card lift={false} className="p-5 text-sm text-muted">
        White-label is per-tenant config: <span className="font-mono text-xs">{"{brand_name, logo_url, primary_color, custom_domain}"}</span>{" "}
        — your clients see your brand, the receipts stay cryptographically iTechSmart.
      </Card>
    </PageEnter>
  )
}

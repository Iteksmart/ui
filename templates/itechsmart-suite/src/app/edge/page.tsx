"use client"

// Edge deployment — regions, tunnel, and rollout health.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Boxes, Globe2 } from "lucide-react"

import { demoRegions } from "@/lib/demo-suite"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card } from "@/components/ui"

export default function EdgePage() {
  const { data: regions } = useQuery({ queryKey: ["regions"], queryFn: async () => demoRegions() })

  return (
    <PageEnter>
      <PageHeader
        title="Edge"
        subtitle="Where the platform touches the world — bare metal, tunnel, backups, and external deploys."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {regions?.map((r, i) => (
          <motion.div
            key={r.region}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                  <Globe2 className="size-4.5 text-accent" aria-hidden />
                </span>
                <Badge
                  className={
                    r.state === "healthy"
                      ? "pulse-operational bg-success-soft text-success"
                      : "bg-info-soft text-info"
                  }
                >
                  {r.state}
                </Badge>
              </div>
              <p className="mt-3 text-sm font-semibold">{r.region}</p>
              <div className="mt-3 flex gap-6 text-sm">
                <span className="flex items-center gap-1.5 text-muted">
                  <Boxes className="size-3.5" aria-hidden />
                  {r.nodes} node{r.nodes === 1 ? "" : "s"}
                </span>
                <span className="font-mono tabular-nums text-muted">{r.latency}ms</span>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card lift={false} className="p-5 text-sm text-muted">
        Ingress: Cloudflare Tunnel <span className="font-mono">3525b90f</span> fronts every subdomain —
        origin cert valid to 2041. Goal state: port 22 closed once tunnel access is fully verified.
      </Card>
    </PageEnter>
  )
}

"use client"

// Workflow marketplace — install proven automations.
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { Download, ShoppingBag, Star } from "lucide-react"

import { demoMarketplaceItems } from "@/lib/demo-suite"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card } from "@/components/ui"

export default function MarketplacePage() {
  const { data: items } = useQuery({ queryKey: ["marketplace"], queryFn: async () => demoMarketplaceItems() })
  const toast = useToast()

  return (
    <PageEnter>
      <PageHeader
        title="Marketplace"
        subtitle="Proven workflows from the platform and the community — every install is twin-checked and receipt-sealed."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items?.map((item, i) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
          >
            <Card className="flex h-full flex-col p-5">
              <div className="flex items-start justify-between">
                <span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft">
                  <ShoppingBag className="size-4.5 text-accent" aria-hidden />
                </span>
                <Badge className="bg-accent-soft text-accent">{item.tag}</Badge>
              </div>
              <p className="mt-3 text-sm font-semibold">{item.name}</p>
              <p className="mt-1 text-xs text-muted">by {item.author}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted">
                <span className="flex items-center gap-1">
                  <Star className="size-3.5 text-warning" aria-hidden />
                  {item.rating}
                </span>
                <span className="flex items-center gap-1">
                  <Download className="size-3.5" aria-hidden />
                  {item.installs} installs
                </span>
              </div>
              <div className="mt-4 flex-1" />
              <Button
                variant="ghost"
                className="w-full"
                onClick={() =>
                  toast("success", `${item.name} installed — twin-checked, receipt sealed`)
                }
              >
                Install
              </Button>
            </Card>
          </motion.div>
        ))}
      </div>
    </PageEnter>
  )
}

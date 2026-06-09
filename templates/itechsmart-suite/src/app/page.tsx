"use client"

// Suite launcher — shown on localhost / the bare container host. In
// production each subdomain is rewritten straight to its app by middleware.
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { SUITE_APPS } from "@/lib/apps"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Card } from "@/components/ui"

export default function SuiteHome() {
  return (
    <PageEnter>
      <PageHeader
        title="iTechSmart Suite"
        subtitle="Twenty frontends, one design system, one container. Each app below is served at its own subdomain in production."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SUITE_APPS.map((app, i) => (
          <motion.div
            key={app.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
          >
            <Link
              href={`/${app.slug}`}
              className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <Card className="group h-full p-5">
                <div className="flex items-start justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft">
                    <app.icon className="size-5 text-accent" aria-hidden />
                  </span>
                  <ArrowUpRight
                    className="size-4 text-muted-faint transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden
                  />
                </div>
                <p className="mt-3 text-sm font-semibold">{app.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted">{app.tagline}</p>
                <p className="mt-2 font-mono text-[11px] text-muted-faint">{app.domain}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </PageEnter>
  )
}

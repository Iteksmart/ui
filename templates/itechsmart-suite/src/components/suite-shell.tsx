"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ChevronDown, Grip, Hexagon } from "lucide-react"

import { usePlatformStatus } from "@/lib/api"
import { appBySlug, SUITE_APPS } from "@/lib/apps"
import { cn } from "@/lib/utils"

import { Badge } from "./ui"
import { ThemeToggle } from "./theme-toggle"

function StatusBadge() {
  const { data } = usePlatformStatus()
  const status = data?.status ?? "OPERATIONAL"
  const operational = status === "OPERATIONAL"
  return (
    <a
      href="https://api.itechsmart.dev/v1/status/live"
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Platform status: ${status}`}
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <Badge
        className={cn(
          operational ? "pulse-operational bg-success-soft text-success" : "bg-danger-soft text-danger"
        )}
      >
        <span className={cn("size-1.5 rounded-full", operational ? "bg-success" : "bg-danger")} />
        {status}
      </Badge>
    </a>
  )
}

function SuiteSwitcher({ currentSlug }: { currentSlug: string | null }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onClick)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Switch suite app"
        className="btn-press flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-accent-soft hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <Grip className="size-3.5" aria-hidden />
        Suite
        <ChevronDown className={cn("size-3 transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ type: "spring", duration: 0.25 }}
            className="absolute right-0 z-50 mt-2 grid w-[420px] max-w-[88vw] grid-cols-2 gap-1 rounded-2xl border border-edge bg-raised p-2 shadow-2xl sm:grid-cols-3"
          >
            {SUITE_APPS.map((app) => (
              <Link
                key={app.slug}
                href={`/${app.slug}`}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors",
                  app.slug === currentSlug
                    ? "bg-accent-soft text-accent"
                    : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
                )}
              >
                <app.icon className="size-4.5" aria-hidden />
                <span className="text-[11px] font-medium leading-tight">{app.name}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function SuiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const slug = pathname.split("/")[1] || null
  const app = slug ? appBySlug(slug) : undefined

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="aurora" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-edge bg-background/70 backdrop-blur-md">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href={app ? `/${app.slug}` : "/"}
            className="flex min-w-0 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-its-purple to-its-purple-light text-white shadow">
              {app ? <app.icon className="size-4" aria-hidden /> : <Hexagon className="size-4" aria-hidden />}
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-bold tracking-tight">
                {app?.name ?? "iTechSmart Suite"}
              </span>
              <span className="hidden truncate text-[11px] text-muted sm:block">
                {app?.domain ?? "20 frontends · one design system"}
              </span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2.5">
            <StatusBadge />
            <SuiteSwitcher currentSlug={slug} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>

      <footer className="border-t border-edge px-6 py-4 text-center text-xs text-muted">
        Powered by ProofLink —{" "}
        <a
          href="https://verify.itechsmart.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-accent hover:underline"
        >
          verify.itechsmart.dev
        </a>{" "}
        · 0 chain breaks · Bitcoin-anchored
      </footer>
    </div>
  )
}

"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "motion/react"
import {
  Activity,
  Flame,
  Gauge,
  Hexagon,
  Menu,
  Scale,
  ShieldCheck,
  X,
} from "lucide-react"

import { usePlatformStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

import { CommandPalette } from "./command-palette"
import { Badge } from "./ui"
import { ThemeToggle } from "./theme-toggle"

export const NAV = [
  { href: "/", label: "Overview", icon: Gauge },
  { href: "/warroom", label: "War Room", icon: Flame },
  { href: "/arbiter", label: "Arbiter", icon: Scale },
  { href: "/prooflink", label: "ProofLink", icon: ShieldCheck },
] as const

function StatusBadge() {
  const { data } = usePlatformStatus()
  const status = data?.status ?? "OPERATIONAL"
  const operational = status === "OPERATIONAL"
  return (
    <a
      href="https://api.itechsmart.dev/v1/status/live"
      target="_blank"
      rel="noopener noreferrer"
      className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      aria-label={`Platform status: ${status}`}
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

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  React.useEffect(() => setMobileOpen(false), [pathname])

  const nav = (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              active
                ? "bg-accent-soft text-accent"
                : "text-muted hover:bg-accent-soft/60 hover:text-foreground"
            )}
          >
            <Icon className="size-4.5" aria-hidden />
            {label}
            {active && (
              <motion.span
                layoutId="nav-pill"
                className="ml-auto size-1.5 rounded-full bg-accent"
                aria-hidden
              />
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-dvh">
      <div className="aurora" aria-hidden />
      <CommandPalette />

      {/* Sidebar — desktop */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-edge bg-surface/60 p-4 backdrop-blur-md lg:flex">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-2 pt-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-its-purple to-its-purple-light text-white shadow-lg">
            <Hexagon className="size-5" aria-hidden />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight">iTechSmart</span>
            <span className="block text-xs text-muted">Command Center</span>
          </span>
        </Link>
        {nav}
        <div className="mt-auto space-y-3 px-2 pb-1">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Activity className="size-3.5 text-success live-dot" aria-hidden />
            Live · refreshed every 15s
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <motion.div
            initial={{ x: -260 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute inset-y-0 left-0 w-64 border-r border-edge bg-raised p-4"
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm font-bold">iTechSmart</span>
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 hover:bg-accent-soft"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
            {nav}
          </motion.div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-edge bg-background/70 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 hover:bg-accent-soft lg:hidden"
          >
            <Menu className="size-5" aria-hidden />
          </button>
          <StatusBadge />
          <span className="hidden text-xs text-muted sm:block">
            141 containers · 116 SSL subdomains · OVH bare-metal
          </span>
          <div className="ml-auto flex items-center gap-3">
            <kbd className="hidden rounded-md border border-edge bg-surface px-2 py-1 font-mono text-[11px] text-muted sm:block">
              ⌘K
            </kbd>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

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
    </div>
  )
}

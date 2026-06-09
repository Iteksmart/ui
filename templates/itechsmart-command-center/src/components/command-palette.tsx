"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { Flame, Gauge, Moon, Scale, Search, ShieldCheck } from "lucide-react"

import { useTheme } from "./providers"

const COMMANDS = [
  { label: "Go to Overview", href: "/", icon: Gauge, keywords: "home dashboard metrics" },
  { label: "Go to War Room", href: "/warroom", icon: Flame, keywords: "incidents ag2 agents" },
  { label: "Go to Arbiter", href: "/arbiter", icon: Scale, keywords: "approvals queue governance" },
  { label: "Go to ProofLink", href: "/prooflink", icon: ShieldCheck, keywords: "receipts ledger verify" },
]

export function CommandPalette() {
  const router = useRouter()
  const { toggle } = useTheme()
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [index, setIndex] = React.useState(0)

  const items = React.useMemo(() => {
    const all = [
      ...COMMANDS.map((c) => ({ ...c, run: () => router.push(c.href) })),
      { label: "Toggle dark / light mode", icon: Moon, keywords: "theme appearance", run: toggle },
    ]
    const q = query.toLowerCase().trim()
    if (!q) return all
    return all.filter((c) => (c.label + " " + c.keywords).toLowerCase().includes(q))
  }, [query, router, toggle])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
        setQuery("")
        setIndex(0)
      }
      if (e.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const select = (i: number) => {
    items[i]?.run()
    setOpen(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[18vh] backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ scale: 0.95, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.25 }}
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-edge bg-raised shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-edge px-4">
              <Search className="size-4 text-muted" aria-hidden />
              <input
                autoFocus
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setIndex(0)
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") setIndex((i) => Math.min(i + 1, items.length - 1))
                  if (e.key === "ArrowUp") setIndex((i) => Math.max(i - 1, 0))
                  if (e.key === "Enter") select(index)
                }}
                placeholder="Search commands…"
                aria-label="Search commands"
                className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-faint"
              />
            </div>
            <ul className="max-h-72 overflow-y-auto p-2" role="listbox">
              {items.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted">No matching commands</li>
              )}
              {items.map((item, i) => (
                <li key={item.label} role="option" aria-selected={i === index}>
                  <button
                    onClick={() => select(i)}
                    onMouseEnter={() => setIndex(i)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${
                      i === index ? "bg-accent-soft text-accent" : "text-foreground"
                    }`}
                  >
                    <item.icon className="size-4" aria-hidden />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

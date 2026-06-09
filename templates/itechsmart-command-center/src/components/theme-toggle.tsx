"use client"

import { Moon, Sun } from "lucide-react"

import { useTheme } from "./providers"

export function ThemeToggle() {
  const { dark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="btn-press relative flex h-8 w-14 items-center rounded-full border border-edge bg-surface px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className="flex size-6 items-center justify-center rounded-full bg-accent text-white shadow transition-transform duration-200 ease-out"
        style={{ transform: dark ? "translateX(0)" : "translateX(24px)" }}
      >
        {dark ? <Moon className="size-3.5" aria-hidden /> : <Sun className="size-3.5" aria-hidden />}
      </span>
    </button>
  )
}

"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { ToastProvider } from "./toast"

const ThemeContext = React.createContext<{
  dark: boolean
  toggle: () => void
}>({ dark: true, toggle: () => {} })

export function useTheme() {
  return React.useContext(ThemeContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 4000, retry: 1 } },
      })
  )
  const [dark, setDark] = React.useState(true)

  React.useEffect(() => {
    const stored = window.localStorage.getItem("its-theme")
    if (stored) setDark(stored === "dark")
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
    window.localStorage.setItem("its-theme", dark ? "dark" : "light")
  }, [dark])

  const toggle = React.useCallback(() => setDark((d) => !d), [])

  return (
    <QueryClientProvider client={client}>
      <ThemeContext.Provider value={{ dark, toggle }}>
        <ToastProvider>{children}</ToastProvider>
      </ThemeContext.Provider>
    </QueryClientProvider>
  )
}

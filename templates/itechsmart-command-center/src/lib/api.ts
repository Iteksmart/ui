"use client"

// Data access layer. When NEXT_PUBLIC_ITS_API_BASE / NEXT_PUBLIC_ITS_VERIFY_BASE
// are set, hooks pull from the live platform endpoints and fall back to the
// demo simulator on any failure — the UI never blanks out.
import { useQuery } from "@tanstack/react-query"

import {
  demoArbiterQueue,
  demoBookings,
  demoFunnel,
  demoIncidents,
  demoLedger,
  demoMttrSeries,
  demoReceiptSeries,
  demoReceipts,
  demoStatus,
} from "./demo"
import type { LedgerStats, PlatformStatus } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_ITS_API_BASE // e.g. https://api.itechsmart.dev
const VERIFY_BASE = process.env.NEXT_PUBLIC_ITS_VERIFY_BASE // e.g. https://verify.itechsmart.dev

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

export function usePlatformStatus() {
  return useQuery<PlatformStatus>({
    queryKey: ["platform-status"],
    queryFn: async () => {
      if (API_BASE) {
        try {
          const live = await getJson<Record<string, unknown>>(`${API_BASE}/v1/status/live`)
          const demo = demoStatus()
          return {
            ...demo,
            containers: Number(live.containers ?? demo.containers),
            autonomyRate: Number(live.autonomy_rate ?? demo.autonomyRate),
            mttrMinutes: Number(live.mttr ?? demo.mttrMinutes),
          }
        } catch {
          /* fall through to demo */
        }
      }
      return demoStatus()
    },
    refetchInterval: 15000,
  })
}

export function useLedgerStats() {
  return useQuery<LedgerStats>({
    queryKey: ["ledger-stats"],
    queryFn: async () => {
      if (VERIFY_BASE) {
        try {
          const live = await getJson<Record<string, unknown>>(`${VERIFY_BASE}/api/stats`)
          const demo = demoLedger()
          return {
            ...demo,
            receipts: Number(live.receipts ?? live.total ?? demo.receipts),
            chainBreaks: Number(live.chain_breaks ?? 0),
          }
        } catch {
          /* fall through to demo */
        }
      }
      return demoLedger()
    },
    refetchInterval: 10000,
  })
}

export function useIncidents() {
  return useQuery({
    queryKey: ["incidents"],
    queryFn: async () => demoIncidents(),
    refetchInterval: 5000,
  })
}

export function useArbiterQueue() {
  return useQuery({
    queryKey: ["arbiter-queue"],
    queryFn: async () => demoArbiterQueue(),
    refetchInterval: 8000,
  })
}

export function useReceipts() {
  return useQuery({
    queryKey: ["receipts"],
    queryFn: async () => demoReceipts(),
    refetchInterval: 12000,
  })
}

export function useMttrSeries() {
  return useQuery({ queryKey: ["mttr-series"], queryFn: async () => demoMttrSeries() })
}

export function useReceiptSeries() {
  return useQuery({ queryKey: ["receipt-series"], queryFn: async () => demoReceiptSeries() })
}

export function useFunnel() {
  return useQuery({ queryKey: ["funnel"], queryFn: async () => demoFunnel() })
}

export function useBookings() {
  return useQuery({ queryKey: ["bookings"], queryFn: async () => demoBookings() })
}

export type Severity = "critical" | "high" | "medium" | "low"

export type PlatformStatus = {
  status: "OPERATIONAL" | "DEGRADED" | "OUTAGE"
  containers: number
  databases: number
  sslSubdomains: number
  autonomyRate: number
  mttrMinutes: number
  uptimePct: number
}

export type LedgerStats = {
  receipts: number
  chainBreaks: number
  bitcoinAnchored: string
  sealedToday: number
}

export type Incident = {
  id: string
  title: string
  service: string
  severity: Severity
  status: "detected" | "analyzing" | "remediating" | "resolved"
  agentStage: number // 0..5 → position in the 6-agent AG2 pipeline
  startedAt: number
  mttrSeconds?: number
}

export type ArbiterAction = {
  id: string
  action: string
  service: string
  risk: Severity
  requestedBy: string
  blastRadius: number
  requestedAt: number
  status: "pending" | "approved" | "rejected"
}

export type Receipt = {
  id: string
  category: string
  hash: string
  sealedAt: number
  anchored: boolean
}

export type MetricPoint = { t: string; v: number }

export type PipelineStage = { stage: string; count: number }

export type Booking = {
  id: string
  name: string
  company: string
  tier: "MSP" | "Enterprise"
  status: "new" | "reviewing" | "qualified" | "pilot" | "customer"
  bookedAt: number
}

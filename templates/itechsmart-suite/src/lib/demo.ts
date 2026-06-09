// Stateful demo simulator. Numbers drift realistically between polls so the
// dashboard feels alive without a backend. Swap to live endpoints by setting
// NEXT_PUBLIC_ITS_API_BASE (see api.ts).
import type {
  ArbiterAction,
  Booking,
  Incident,
  LedgerStats,
  MetricPoint,
  PipelineStage,
  PlatformStatus,
  Receipt,
  Severity,
} from "./types"

let seed = 42
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]
}

const t0 = Date.now()
const elapsedMin = () => (Date.now() - t0) / 60000

// ── Platform status ─────────────────────────────────────────────────
export function demoStatus(): PlatformStatus {
  return {
    status: "OPERATIONAL",
    containers: 141,
    databases: 91,
    sslSubdomains: 116,
    autonomyRate: 94.2 + Math.sin(elapsedMin() / 3) * 0.6,
    mttrMinutes: 2.07 + Math.sin(elapsedMin() / 5) * 0.12,
    uptimePct: 99.98,
  }
}

// ── ProofLink ledger ─────────────────────────────────────────────────
let receiptBase = 28906
export function demoLedger(): LedgerStats {
  receiptBase += Math.floor(rand() * 3)
  return {
    receipts: receiptBase,
    chainBreaks: 0,
    bitcoinAnchored: "4/4 OTS calendars",
    sealedToday: 212 + Math.floor(elapsedMin() * 2),
  }
}

const categories = [
  "ag2_incident_resolved",
  "backup_r2_synced",
  "jwt_rotation_complete",
  "dashboard_upgrade_live",
  "pilot_booked",
  "cron_health_verified",
  "production_grade_audit_complete",
]

function hash() {
  const hex = "0123456789abcdef"
  let h = ""
  for (let i = 0; i < 16; i++) h += hex[Math.floor(rand() * 16)]
  return h
}

let receiptSeq = 0
export function demoReceipts(n = 12): Receipt[] {
  const out: Receipt[] = []
  for (let i = 0; i < n; i++) {
    out.push({
      id: `rcpt_${(receiptBase - i).toString(36)}${hash().slice(0, 6)}`,
      category: categories[(receiptSeq + i) % categories.length],
      hash: hash() + hash(),
      sealedAt: Date.now() - i * 47000 - Math.floor(rand() * 20000),
      anchored: i % 3 !== 1,
    })
  }
  receiptSeq++
  return out
}

// ── Incidents (war room) ─────────────────────────────────────────────
const services = [
  "suite-octoai",
  "itechsmart-ag2",
  "suite-n8n",
  "api-gateway",
  "itechsmart-dashboard",
  "suite-redis",
  "agentarmy-api-1",
  "wazuh",
]
const incidentTitles = [
  "Memory pressure above threshold",
  "Container restart loop detected",
  "TLS cert renewal drift",
  "Webhook delivery failures",
  "Slow query on core_db",
  "Disk I/O saturation",
  "Health check flapping",
  "Rate limit breach from scraper",
]
const sevs: Severity[] = ["low", "medium", "medium", "high", "low", "critical"]

let incidents: Incident[] = []
let incidentSeq = 100

function newIncident(ageMs = 0): Incident {
  incidentSeq++
  return {
    id: `INC-${incidentSeq}`,
    title: pick(incidentTitles),
    service: pick(services),
    severity: pick(sevs),
    status: "detected",
    agentStage: 0,
    startedAt: Date.now() - ageMs,
  }
}

// Seed history: a few resolved + one in flight
if (incidents.length === 0) {
  for (let i = 5; i >= 1; i--) {
    const inc = newIncident(i * 9 * 60000)
    inc.status = "resolved"
    inc.agentStage = 5
    inc.mttrSeconds = 90 + Math.floor(rand() * 120)
    incidents.push(inc)
  }
  const live = newIncident(40000)
  live.status = "analyzing"
  live.agentStage = 1
  incidents.unshift(live)
}

export function demoIncidents(): Incident[] {
  // advance in-flight incidents through the AG2 pipeline
  for (const inc of incidents) {
    if (inc.status === "resolved") continue
    const age = Date.now() - inc.startedAt
    const stage = Math.min(5, Math.floor(age / 25000))
    inc.agentStage = stage
    inc.status = stage >= 5 ? "resolved" : stage >= 3 ? "remediating" : stage >= 1 ? "analyzing" : "detected"
    if (inc.status === "resolved" && !inc.mttrSeconds) {
      inc.mttrSeconds = Math.floor(age / 1000)
    }
  }
  // occasionally spawn a new one
  if (rand() < 0.18 && incidents.filter((i) => i.status !== "resolved").length < 2) {
    incidents.unshift(newIncident())
  }
  incidents = incidents.slice(0, 12)
  return [...incidents]
}

// ── Arbiter queue ────────────────────────────────────────────────────
const actions = [
  ["Restart suite-octoai container", "suite-octoai", "high"],
  ["Rotate PASSPORT_JWT_SECRET", "suite services", "critical"],
  ["Scale n8n worker pool to 4", "suite-n8n", "medium"],
  ["Purge Redis cache namespace gtm:*", "suite-redis", "medium"],
  ["Apply nginx route for marketplace", "suite-nginx", "high"],
  ["Re-run failed R2 backup sync", "cloudflare-r2", "low"],
] as const

let arbiterQueue: ArbiterAction[] = actions.slice(0, 4).map(([action, service, risk], i) => ({
  id: `ARB-${2040 + i}`,
  action,
  service,
  risk: risk as Severity,
  requestedBy: i % 2 === 0 ? "AG2 RemediationPlanner" : "Hermes Agent",
  blastRadius: [3, 17, 5, 1][i],
  requestedAt: Date.now() - (i + 1) * 6 * 60000,
  status: "pending",
}))

export function demoArbiterQueue(): ArbiterAction[] {
  return [...arbiterQueue]
}

export function demoArbiterDecide(id: string, decision: "approved" | "rejected") {
  arbiterQueue = arbiterQueue.map((a) => (a.id === id ? { ...a, status: decision } : a))
}

// ── Charts ───────────────────────────────────────────────────────────
export function demoMttrSeries(): MetricPoint[] {
  const out: MetricPoint[] = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    out.push({
      t: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      v: +(4.6 - (13 - i) * 0.18 + Math.sin(i * 1.7) * 0.25).toFixed(2),
    })
  }
  return out
}

export function demoReceiptSeries(): MetricPoint[] {
  const out: MetricPoint[] = []
  let total = 26100
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000)
    total += 160 + Math.floor(Math.sin(i * 2.1) * 40) + 40
    out.push({
      t: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      v: total,
    })
  }
  return out
}

export function demoSparkline(base: number, jitter: number): number[] {
  return Array.from({ length: 16 }, (_, i) => base + Math.sin(i / 2.2) * jitter + rand() * jitter)
}

// ── Sales pipeline ───────────────────────────────────────────────────
export function demoFunnel(): PipelineStage[] {
  return [
    { stage: "Leads", count: 45 },
    { stage: "Delivered", count: 42 },
    { stage: "Opened", count: 31 },
    { stage: "Replied", count: 9 },
    { stage: "Pilots", count: 4 },
    { stage: "Customers", count: 2 },
  ]
}

export function demoBookings(): Booking[] {
  const rows: [string, string, Booking["tier"], Booking["status"]][] = [
    ["M. Chen", "Halcyon Health", "Enterprise", "pilot"],
    ["R. Alvarez", "Westgate MSP", "MSP", "pilot"],
    ["S. Okafor", "Brightline Logistics", "Enterprise", "qualified"],
    ["J. Whitfield", "Cobalt Federal", "Enterprise", "reviewing"],
    ["T. Nguyen", "Parkside IT", "MSP", "customer"],
    ["A. Brooks", "Meridian Claims", "MSP", "new"],
  ]
  return rows.map(([name, company, tier, status], i) => ({
    id: `PB-${310 + i}`,
    name,
    company,
    tier,
    status,
    bookedAt: Date.now() - i * 26 * 3600000,
  }))
}

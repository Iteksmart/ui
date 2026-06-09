// Simulated data for the suite apps. Each generator mirrors the shape of the
// live endpoint it stands in for (§4 of the master context); api.ts swaps in
// real fetches when NEXT_PUBLIC_ITS_API_BASE is set.
import type { MetricPoint } from "./types"

let seed = 1337
function rand() {
  seed = (seed * 1103515245 + 12345) % 2147483648
  return seed / 2147483648
}

// ── ImpactOS ─────────────────────────────────────────────────────────
export type ImpactSummary = {
  dollarsSaved: number
  hoursSaved: number
  incidentsAutoResolved: number
  mttrBeforeMin: number
  mttrAfterMin: number
  autonomyRate: number
}

export function demoImpact(): ImpactSummary {
  return {
    dollarsSaved: 184_350,
    hoursSaved: 1_240,
    incidentsAutoResolved: 312,
    mttrBeforeMin: 47,
    mttrAfterMin: 2.07,
    autonomyRate: 94.2,
  }
}

export function demoSavingsSeries(): MetricPoint[] {
  const out: MetricPoint[] = []
  let total = 0
  for (let i = 11; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    total += 9_000 + i * 600 + rand() * 2000
    out.push({ t: d.toLocaleDateString("en-US", { month: "short" }), v: Math.round(total) })
  }
  return out
}

// ── CMDB graph (architect / knowledge-graph) ─────────────────────────
export type GraphNode = {
  id: string
  label: string
  type: "service" | "database" | "container" | "network" | "external"
  critical?: boolean
}
export type GraphEdge = { source: string; target: string }
export type CmdbGraph = {
  nodes: GraphNode[]
  edges: GraphEdge[]
  totals: { nodes: number; edges: number; types: Record<string, number> }
}

export function demoCmdbGraph(): CmdbGraph {
  const services = [
    "djuane-ai",
    "api-gateway",
    "itechsmart-seal",
    "itechsmart-rollback-api",
    "itechsmart-ag2",
    "itechsmart-dashboard",
    "agentarmy-api-1",
    "suite-octoai",
    "suite-n8n",
    "wazuh",
    "hermes-agent",
  ]
  const nodes: GraphNode[] = [
    { id: "suite-nginx", label: "suite-nginx", type: "network", critical: true },
    { id: "suite-postgres", label: "suite-postgres", type: "database", critical: true },
    { id: "suite-redis", label: "suite-redis", type: "database" },
    { id: "cloudflare", label: "Cloudflare Tunnel", type: "external" },
    { id: "prometheus", label: "suite-prometheus", type: "service" },
    ...services.map((s): GraphNode => ({ id: s, label: s, type: "container", critical: s === "djuane-ai" })),
  ]
  const edges: GraphEdge[] = [
    { source: "cloudflare", target: "suite-nginx" },
    ...services.map((s) => ({ source: "suite-nginx", target: s })),
    { source: "djuane-ai", target: "suite-postgres" },
    { source: "djuane-ai", target: "suite-redis" },
    { source: "djuane-ai", target: "itechsmart-seal" },
    { source: "api-gateway", target: "suite-postgres" },
    { source: "itechsmart-ag2", target: "djuane-ai" },
    { source: "itechsmart-ag2", target: "itechsmart-seal" },
    { source: "agentarmy-api-1", target: "suite-octoai" },
    { source: "suite-n8n", target: "suite-postgres" },
    { source: "itechsmart-dashboard", target: "api-gateway" },
    { source: "prometheus", target: "djuane-ai" },
    { source: "wazuh", target: "suite-nginx" },
    { source: "hermes-agent", target: "djuane-ai" },
    { source: "itechsmart-rollback-api", target: "suite-postgres" },
  ]
  return {
    nodes,
    edges,
    totals: {
      nodes: 573,
      edges: 1000,
      types: { container: 141, service: 212, database: 91, network: 64, external: 65 },
    },
  }
}

export function blastRadius(graph: CmdbGraph, id: string): Set<string> {
  // downstream reach: everything that depends on `id` (reverse edges)
  const dependents = new Map<string, string[]>()
  for (const e of graph.edges) {
    const list = dependents.get(e.target) ?? []
    list.push(e.source)
    dependents.set(e.target, list)
  }
  const hit = new Set<string>([id])
  const stack = [id]
  while (stack.length) {
    const cur = stack.pop()!
    for (const dep of dependents.get(cur) ?? []) {
      if (!hit.has(dep)) {
        hit.add(dep)
        stack.push(dep)
      }
    }
  }
  return hit
}

// ── Certification ────────────────────────────────────────────────────
export type CertCriterion = { name: string; done: boolean; tier: "bronze" | "silver" | "gold" }

export function demoCertification() {
  const criteria: CertCriterion[] = [
    { name: "Health checks on all containers", done: true, tier: "bronze" },
    { name: "ProofLink receipts on every deploy", done: true, tier: "bronze" },
    { name: "Automated rollback engine live", done: true, tier: "bronze" },
    { name: "MTTR under 15 minutes", done: true, tier: "silver" },
    { name: "Autonomy rate above 80%", done: true, tier: "silver" },
    { name: "Digital Twin what-if before changes", done: true, tier: "silver" },
    { name: "MTTR under 5 minutes", done: true, tier: "gold" },
    { name: "Autonomy rate above 95%", done: false, tier: "gold" },
    { name: "Zero-downtime quarter verified", done: false, tier: "gold" },
  ]
  return { current: "Silver", next: "Gold", criteria }
}

// ── Market intelligence ──────────────────────────────────────────────
export function demoCampaigns() {
  return [
    { id: "MK-1", name: "CISO/VP IT Outreach — June", channel: "Apollo", status: "active", sent: 45, opened: 31, replied: 9 },
    { id: "MK-2", name: "Hourly image posts", channel: "Make 5300055", status: "active", sent: 168, opened: 0, replied: 0 },
    { id: "MK-3", name: "ProofLink social proof", channel: "n8n WF-03", status: "paused", sent: 0, opened: 0, replied: 0 },
    { id: "MK-4", name: "Weekly newsletter", channel: "n8n WF-04", status: "blocked", sent: 0, opened: 0, replied: 0 },
  ] as const
}

export function demoEngagementSeries(): MetricPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000)
    return {
      t: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      v: Math.round(120 + i * 14 + Math.sin(i * 1.4) * 30 + rand() * 20),
    }
  })
}

// ── Pulse scanner ────────────────────────────────────────────────────
export type PulseTarget = {
  host: string
  http: number
  latencyMs: number
  ssl: "valid" | "expiring" | "invalid"
  state: "healthy" | "warn" | "down"
}

export function demoPulse(): PulseTarget[] {
  const hosts = [
    "dashboard.itechsmart.dev",
    "verify.itechsmart.dev",
    "api.itechsmart.dev",
    "ag2.itechsmart.dev",
    "warroom.itechsmart.dev",
    "arbiter.itechsmart.dev",
    "impactos.itechsmart.dev",
    "twin.itechsmart.dev",
    "wazuh.itechsmart.dev",
    "n8n.itechsmart.dev",
    "roi.itechsmart.dev",
    "market.itechsmart.dev",
  ]
  return hosts.map((host, i) => {
    const warn = i === 7
    return {
      host,
      http: warn ? 502 : 200,
      latencyMs: Math.round(40 + rand() * 180),
      ssl: i === 9 ? "expiring" : "valid",
      state: warn ? "warn" : "healthy",
    }
  })
}

// ── Connect hub (§8 flavors) ─────────────────────────────────────────
export function demoConnectors() {
  return [
    { name: "Prometheus", flavor: "Native — metrics", status: "active" },
    { name: "Wazuh SIEM", flavor: "Native — security", status: "active" },
    { name: "ProofLink", flavor: "Native — audit", status: "active" },
    { name: "Digital Twin", flavor: "Native — simulation", status: "active" },
    { name: "Datadog", flavor: "Monitoring flavor (MCP)", status: "connected" },
    { name: "PagerDuty", flavor: "Alerting flavor (MCP)", status: "oauth-pending" },
    { name: "Atlassian Jira", flavor: "Ticketing flavor (MCP)", status: "connected" },
    { name: "incident.io", flavor: "Incident flavor (MCP)", status: "connected" },
    { name: "ServiceNow", flavor: "Enterprise ITSM", status: "planned" },
    { name: "Splunk", flavor: "SIEM flavor", status: "planned" },
  ] as const
}

// ── Notify ───────────────────────────────────────────────────────────
export type Notification = {
  id: number
  category: string
  title: string
  body: string
  severity: "info" | "success" | "warning" | "critical"
  read: boolean
  at: number
}

let notifications: Notification[] = [
  { id: 6, category: "pilot_booked", title: "New pilot booking", body: "Halcyon Health booked a 30-day pilot via Calendly.", severity: "success", read: false, at: Date.now() - 14 * 60000 },
  { id: 5, category: "ag2_incident", title: "Incident auto-resolved", body: "INC-104 resolved by ExecutionAgent in 2m 0s. Receipt sealed.", severity: "success", read: false, at: Date.now() - 42 * 60000 },
  { id: 4, category: "arbiter", title: "Approval requested", body: "Hermes Agent requests JWT secret rotation — critical risk.", severity: "warning", read: false, at: Date.now() - 65 * 60000 },
  { id: 3, category: "backup", title: "R2 backup synced", body: "Nightly Postgres backup synced to Cloudflare R2. backup_r2_synced sealed.", severity: "info", read: true, at: Date.now() - 5 * 3600000 },
  { id: 2, category: "cron", title: "Cron failure recovered", body: "analytics_snapshot cron retried and completed on second attempt.", severity: "warning", read: true, at: Date.now() - 9 * 3600000 },
  { id: 1, category: "security", title: "JWT rotation complete", body: "All suite services rotated to the new PASSPORT_JWT_SECRET.", severity: "info", read: true, at: Date.now() - 26 * 3600000 },
]

export function demoNotifications() {
  return [...notifications]
}
export function demoMarkRead(id: number) {
  notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
}
export function demoMarkAllRead() {
  notifications = notifications.map((n) => ({ ...n, read: true }))
}

// ── Workflow manager ─────────────────────────────────────────────────
export function demoWorkflows() {
  return [
    { id: "WF-01", name: "LinkedIn Content Engine", engine: "n8n", status: "blocked", note: "needs Composio OAuth" },
    { id: "WF-02", name: "Apollo Lead Enrichment", engine: "n8n", status: "blocked", note: "needs Composio OAuth" },
    { id: "WF-03", name: "ProofLink Social Proof", engine: "n8n", status: "inactive", note: "" },
    { id: "WF-04", name: "Weekly Newsletter", engine: "n8n", status: "blocked", note: "needs Composio OAuth" },
    { id: "WF-05", name: "Daily Platform Win Post", engine: "n8n", status: "dry-run", note: "" },
    { id: "5300055", name: "Hourly image posts", engine: "Make", status: "active", note: "firing hourly" },
    { id: "5299937", name: "24/7 Social Engine", engine: "Make", status: "blocked", note: "FAL key needed" },
    { id: "5299959", name: "ProofLink blast", engine: "Make", status: "blocked", note: "LinkedIn confirm" },
    { id: "5299647", name: "Apollo inbox watcher", engine: "Make", status: "warn", note: "needs routing fix" },
  ] as const
}

// ── RPA ──────────────────────────────────────────────────────────────
export function demoBots() {
  return [
    { name: "InvoiceParser", runs: 1240, success: 99.1, queue: 3, state: "running" },
    { name: "LeadSyncBot", runs: 868, success: 97.4, queue: 0, state: "idle" },
    { name: "ReceiptAuditor", runs: 2031, success: 99.8, queue: 12, state: "running" },
    { name: "DNSDriftWatcher", runs: 412, success: 100, queue: 0, state: "idle" },
    { name: "CertRenewer", runs: 96, success: 98.9, queue: 1, state: "running" },
  ] as const
}

// ── Forge builds ─────────────────────────────────────────────────────
export function demoBuilds() {
  return [
    { id: "#1482", target: "itechsmart-suite", stage: "deployed", duration: "3m 12s", ok: true },
    { id: "#1481", target: "djuane-ai", stage: "staged (port 39202)", duration: "5m 40s", ok: true },
    { id: "#1480", target: "agentarmy-api", stage: "tests", duration: "2m 05s", ok: true },
    { id: "#1479", target: "itechsmart-dashboard", stage: "deployed", duration: "4m 51s", ok: true },
    { id: "#1478", target: "api-gateway", stage: "failed — lint", duration: "0m 48s", ok: false },
  ] as const
}

// ── Edge ─────────────────────────────────────────────────────────────
export function demoRegions() {
  return [
    { region: "OVH — US East (bare metal)", nodes: 141, state: "healthy", latency: 4 },
    { region: "Cloudflare Tunnel 3525b90f", nodes: 1, state: "healthy", latency: 12 },
    { region: "Cloudflare R2 (backups)", nodes: 1, state: "healthy", latency: 38 },
    { region: "Vercel (marketing only)", nodes: 3, state: "external", latency: 24 },
  ] as const
}

// ── Marketplace ──────────────────────────────────────────────────────
export function demoMarketplaceItems() {
  return [
    { name: "Incident → Slack digest", author: "iTechSmart", installs: 412, rating: 4.9, tag: "incident-response" },
    { name: "Calendly → Stripe tenant", author: "iTechSmart", installs: 308, rating: 4.8, tag: "onboarding" },
    { name: "Blast-radius pre-check", author: "iTechSmart", installs: 271, rating: 5.0, tag: "governance" },
    { name: "R2 backup verifier", author: "community", installs: 196, rating: 4.7, tag: "resilience" },
    { name: "Apollo reply router", author: "community", installs: 154, rating: 4.5, tag: "gtm" },
    { name: "Cert expiry sentinel", author: "iTechSmart", installs: 142, rating: 4.8, tag: "security" },
  ] as const
}

// ── Generative workflow ──────────────────────────────────────────────
export type GeneratedStep = { tool: string; action: string; onError: string }

export function demoGenerateWorkflow(prompt: string): {
  name: string
  steps: GeneratedStep[]
  blastRadius: number
} {
  const p = prompt.toLowerCase()
  const steps: GeneratedStep[] = [
    { tool: "trigger", action: p.includes("daily") || p.includes("every") ? "schedule.cron" : "webhook.receive", onError: "abort" },
  ]
  if (p.includes("slack")) steps.push({ tool: "slack", action: "chat.postMessage → #alerts", onError: "retry x3" })
  if (p.includes("backup") || p.includes("r2")) steps.push({ tool: "cloudflare-r2", action: "object.put (pg_dump)", onError: "alert + abort" })
  if (p.includes("incident") || p.includes("restart")) steps.push({ tool: "digital-twin", action: "what-if blast radius", onError: "abort" }, { tool: "arbiter", action: "request SEMI_AUTO approval", onError: "abort" })
  if (p.includes("email") || p.includes("lead")) steps.push({ tool: "apollo", action: "contacts.enrich", onError: "skip" })
  steps.push({ tool: "prooflink", action: "seal receipt", onError: "retry x3" })
  return {
    name: prompt.slice(0, 48) || "Untitled workflow",
    steps,
    blastRadius: steps.some((s) => s.tool === "arbiter") ? 7 : 1,
  }
}

export function demoWorkflowLibrary() {
  return [
    { prompt: "Every night back up postgres to R2 and seal a receipt", steps: 3, blastRadius: 1, savedAt: Date.now() - 2 * 86400000 },
    { prompt: "When an incident resolves post a summary to Slack", steps: 3, blastRadius: 1, savedAt: Date.now() - 4 * 86400000 },
    { prompt: "Restart octoai when health check fails twice", steps: 5, blastRadius: 7, savedAt: Date.now() - 6 * 86400000 },
  ]
}

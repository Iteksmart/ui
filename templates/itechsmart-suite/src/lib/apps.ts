import type { LucideIcon } from "lucide-react"
import {
  Bell,
  BookOpen,
  CreditCard,
  Handshake,
  Rocket,
  Boxes,
  Calculator,
  Cpu,
  Flame,
  GitBranch,
  Hammer,
  Layers,
  Megaphone,
  Network,
  Plug,
  Radar,
  Scale,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Stamp,
  TrendingUp,
  Trophy,
  Workflow,
} from "lucide-react"

export type SuiteApp = {
  slug: string
  domain: string
  name: string
  tagline: string
  icon: LucideIcon
  priority: number
}

export const SUITE_APPS: SuiteApp[] = [
  {
    slug: "verify",
    domain: "verify.itechsmart.dev",
    name: "ProofLink Verify",
    tagline: "Public cryptographic audit ledger — anyone can verify, no account required",
    icon: ShieldCheck,
    priority: 1,
  },
  {
    slug: "warroom",
    domain: "warroom.itechsmart.dev",
    name: "War Room",
    tagline: "Incident command center — AG2 autonomous remediation in real time",
    icon: Flame,
    priority: 2,
  },
  {
    slug: "arbiter",
    domain: "arbiter.itechsmart.dev",
    name: "Arbiter",
    tagline: "SEMI_AUTO governance gate — human approval for high-risk actions",
    icon: Scale,
    priority: 3,
  },
  {
    slug: "impactos",
    domain: "impactos.itechsmart.dev",
    name: "ImpactOS",
    tagline: "Business value dashboard — MTTR savings, autonomy, dollars recovered",
    icon: TrendingUp,
    priority: 4,
  },
  {
    slug: "generative-workflow",
    domain: "generative-workflow.itechsmart.dev",
    name: "Generative Workflow",
    tagline: "Natural language → executable workflow JSON with blast-radius preview",
    icon: Sparkles,
    priority: 5,
  },
  {
    slug: "architect",
    domain: "architect.itechsmart.dev",
    name: "Architect",
    tagline: "Interactive CMDB graph — 573 nodes, 1,000 edges, live blast radius",
    icon: Network,
    priority: 6,
  },
  {
    slug: "certification",
    domain: "certification.itechsmart.dev",
    name: "UAIO Certification",
    tagline: "Bronze → Silver → Gold autonomous-operations progression",
    icon: Trophy,
    priority: 7,
  },
  {
    slug: "twin",
    domain: "twin.itechsmart.dev",
    name: "Digital Twin",
    tagline: "What-if simulation — blast radius before you touch production",
    icon: GitBranch,
    priority: 8,
  },
  {
    slug: "market",
    domain: "market.itechsmart.dev",
    name: "Market Intelligence",
    tagline: "AI marketing engine — campaigns, social automation, engagement",
    icon: Megaphone,
    priority: 9,
  },
  {
    slug: "roi",
    domain: "roi.itechsmart.dev",
    name: "ROI Calculator",
    tagline: "Model your savings — incidents, hours, and dollars per month",
    icon: Calculator,
    priority: 10,
  },
  {
    slug: "knowledge-graph",
    domain: "knowledge-graph.itechsmart.dev",
    name: "Knowledge Graph",
    tagline: "Query the CMDB — nodes, edges, types, and impact paths",
    icon: Layers,
    priority: 11,
  },
  {
    slug: "prooflink",
    domain: "prooflink.itechsmart.dev",
    name: "ProofLink Manager",
    tagline: "Ledger operations — categories, anchoring, seal pipeline",
    icon: Stamp,
    priority: 12,
  },
  {
    slug: "pulse",
    domain: "pulse.itechsmart.dev",
    name: "Pulse Scanner",
    tagline: "Continuous platform scan — 141 containers, 116 SSL subdomains",
    icon: Radar,
    priority: 13,
  },
  {
    slug: "connect",
    domain: "connect.itechsmart.dev",
    name: "Connect Hub",
    tagline: "Integration flavors — bring your own monitoring, ticketing, SIEM",
    icon: Plug,
    priority: 14,
  },
  {
    slug: "notify",
    domain: "notify.itechsmart.dev",
    name: "Notify",
    tagline: "Unified notification center — every alert, one feed",
    icon: Bell,
    priority: 15,
  },
  {
    slug: "workflow",
    domain: "workflow.itechsmart.dev",
    name: "Workflow Manager",
    tagline: "n8n + Make automation fleet — status, runs, error handlers",
    icon: Workflow,
    priority: 16,
  },
  {
    slug: "rpa",
    domain: "rpa.itechsmart.dev",
    name: "RPA Dashboard",
    tagline: "Robot fleet — runs, success rates, and queue depth",
    icon: Cpu,
    priority: 17,
  },
  {
    slug: "forge",
    domain: "forge.itechsmart.dev",
    name: "Forge",
    tagline: "Build pipeline — stages, artifacts, deploy receipts",
    icon: Hammer,
    priority: 18,
  },
  {
    slug: "edge",
    domain: "edge.itechsmart.dev",
    name: "Edge",
    tagline: "Edge deployment — regions, rollouts, tunnel health",
    icon: Boxes,
    priority: 19,
  },
  {
    slug: "marketplace",
    domain: "marketplace.itechsmart.dev",
    name: "Marketplace",
    tagline: "Workflow marketplace — install proven automations in one click",
    icon: ShoppingBag,
    priority: 20,
  },
  {
    slug: "signup",
    domain: "signup.itechsmart.dev",
    name: "Get Started",
    tagline: "Self-service signup — ICP-scored, sandbox provisioned in minutes",
    icon: Rocket,
    priority: 21,
  },
  {
    slug: "billing",
    domain: "billing.itechsmart.dev",
    name: "Billing",
    tagline: "Usage metering — every sealed receipt is a metered action",
    icon: CreditCard,
    priority: 22,
  },
  {
    slug: "partner",
    domain: "partner.itechsmart.dev",
    name: "Partner Portal",
    tagline: "MSP reseller console — all client tenants, one grid, 30% revenue share",
    icon: Handshake,
    priority: 23,
  },
  {
    slug: "docs",
    domain: "docs.itechsmart.dev",
    name: "Developer Portal",
    tagline: "Docs, SDKs, CLI reference, and a live API playground",
    icon: BookOpen,
    priority: 24,
  },
]

export function appBySlug(slug: string): SuiteApp | undefined {
  return SUITE_APPS.find((a) => a.slug === slug)
}

export function appByHost(host: string): SuiteApp | undefined {
  const h = host.split(":")[0].toLowerCase()
  return SUITE_APPS.find((a) => a.domain === h)
}

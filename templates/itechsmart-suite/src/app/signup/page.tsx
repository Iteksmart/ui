"use client"

// Self-service signup — ICP-scored, animated multi-step flow (Sprint Task 13).
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, MailCheck, Rocket, Server } from "lucide-react"

import { cn } from "@/lib/utils"
import { PageEnter } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card } from "@/components/ui"

const SIZES = ["1–20", "21–200", "201–1,000", "1,000+"] as const
const CHALLENGES = [
  "Incident response is too slow",
  "Compliance evidence takes weeks",
  "Too many tools, no single view",
  "Can't prove what automation did",
] as const

function icpScore(size: string, challenge: string) {
  let score = 30
  if (size === "21–200") score += 30 // MSP sweet spot
  if (size === "201–1,000") score += 25
  if (size === "1,000+") score += 15
  if (challenge.includes("prove")) score += 30
  if (challenge.includes("Compliance")) score += 25
  if (challenge.includes("Incident")) score += 20
  if (challenge.includes("tools")) score += 10
  return Math.min(100, score)
}

const STEPS = ["Company", "Challenge", "Verify", "Provision"] as const

export default function SignupPage() {
  const toast = useToast()
  const [step, setStep] = React.useState(0)
  const [company, setCompany] = React.useState("")
  const [size, setSize] = React.useState<string>("")
  const [challenge, setChallenge] = React.useState<string>("")
  const [email, setEmail] = React.useState("")
  const [provisioning, setProvisioning] = React.useState(false)
  const [provisioned, setProvisioned] = React.useState(false)

  const score = size && challenge ? icpScore(size, challenge) : 0
  const tier = score >= 80 ? "pilot" : score >= 50 ? "trial" : "free"

  const next = () => setStep((s) => Math.min(s + 1, 3))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const provision = () => {
    if (!/.+@.+\..+/.test(email)) {
      toast("error", "Enter a valid work email")
      return
    }
    setProvisioning(true)
    // stands in for tenant creation + Daytona sandbox provisioning
    setTimeout(() => {
      setProvisioning(false)
      setProvisioned(true)
      next()
      toast("success", "Tenant provisioned — receipt sealed: tenant_provisioned")
    }, 1400)
  }

  return (
    <PageEnter>
      <div className="mx-auto max-w-2xl py-4 sm:py-8">
        <div className="text-center">
          <Badge className="pulse-operational mx-auto bg-success-soft text-success">
            <Rocket className="size-3" aria-hidden />
            Instant provisioning · no sales call required
          </Badge>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Your platform in <span className="gradient-text">minutes</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted">
            Answer two questions, verify your email, and we provision a live sandbox with its own
            ProofLink ledger.
          </p>
        </div>

        {/* Progress */}
        <ol className="mx-auto mt-8 flex max-w-md items-center" aria-label="Signup progress">
          {STEPS.map((label, i) => (
            <li key={label} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
              <span className="flex flex-col items-center gap-1.5">
                <motion.span
                  animate={{ scale: i === step ? 1.1 : 1 }}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full border text-xs font-semibold",
                    i < step && "border-success/40 bg-success-soft text-success",
                    i === step && "border-accent bg-accent text-white shadow-[0_0_12px_rgb(var(--glow)/0.5)]",
                    i > step && "border-edge bg-surface text-muted-faint"
                  )}
                >
                  {i < step ? <CheckCircle2 className="size-4" aria-hidden /> : i + 1}
                </motion.span>
                <span className={cn("text-[11px]", i === step ? "font-medium text-foreground" : "text-muted")}>
                  {label}
                </span>
              </span>
              {i < STEPS.length - 1 && (
                <span className={cn("mx-2 mb-5 h-px flex-1", i < step ? "bg-success" : "bg-edge-strong")} aria-hidden />
              )}
            </li>
          ))}
        </ol>

        <Card lift={false} className="mt-6 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="company"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <Building2 className="size-4 text-accent" aria-hidden />
                  Tell us about your company
                </h2>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company name"
                  aria-label="Company name"
                  className="mt-4 h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm outline-none placeholder:text-muted-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                />
                <p className="mt-4 text-xs font-medium text-muted">Company size</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSize(s)}
                      aria-pressed={size === s}
                      className={cn(
                        "btn-press rounded-xl border px-3 py-3 text-sm font-medium",
                        size === s
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-edge bg-surface text-muted hover:bg-accent-soft/50"
                      )}
                    >
                      {s} people
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button onClick={next} disabled={!company.trim() || !size}>
                    Continue
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="challenge"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h2 className="text-sm font-semibold">What hurts the most today?</h2>
                <div className="mt-4 grid grid-cols-1 gap-2">
                  {CHALLENGES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setChallenge(c)}
                      aria-pressed={challenge === c}
                      className={cn(
                        "btn-press rounded-xl border px-4 py-3.5 text-left text-sm font-medium",
                        challenge === c
                          ? "border-accent bg-accent-soft text-accent"
                          : "border-edge bg-surface text-muted hover:bg-accent-soft/50"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </Button>
                  <Button onClick={next} disabled={!challenge}>
                    Continue
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h2 className="flex items-center gap-2 text-sm font-semibold">
                  <MailCheck className="size-4 text-accent" aria-hidden />
                  Where do we send your sandbox?
                </h2>
                <div className="mt-4 rounded-xl border border-edge bg-surface p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">ICP fit score</span>
                    <span className="font-mono font-bold tabular-nums">{score}/100</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-edge">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full",
                        score >= 80 ? "bg-success" : score >= 50 ? "bg-accent" : "bg-warning"
                      )}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted">
                    {tier === "pilot" && "Strong fit — you qualify for an immediate 30-day pilot with a founder onboarding call."}
                    {tier === "trial" && "Good fit — 30-day trial, auto-provisioned now."}
                    {tier === "free" && "We'll start you on the free tier with full docs access."}
                  </p>
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  type="email"
                  aria-label="Work email"
                  className="mt-4 h-11 w-full rounded-lg border border-edge bg-surface px-3 text-sm outline-none placeholder:text-muted-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
                />
                <div className="mt-6 flex justify-between">
                  <Button variant="ghost" onClick={back}>
                    <ArrowLeft className="size-4" aria-hidden />
                    Back
                  </Button>
                  <Button onClick={provision} loading={provisioning}>
                    <Server className="size-4" aria-hidden />
                    Provision my sandbox
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && provisioned && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="py-4 text-center"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5, delay: 0.1 }}
                  className="mx-auto flex size-16 items-center justify-center rounded-full bg-success-soft"
                >
                  <CheckCircle2 className="size-8 text-success" aria-hidden />
                </motion.span>
                <h2 className="mt-4 text-xl font-bold">{company} is live</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
                  Tenant created on the <span className="font-medium text-foreground">{tier}</span> tier.
                  Your Daytona sandbox and tenant-scoped ProofLink ledger are spinning up — check{" "}
                  <span className="font-mono text-xs">{email}</span> for credentials.
                </p>
                <div className="mx-auto mt-5 max-w-sm rounded-xl border border-edge bg-surface p-4 text-left">
                  {[
                    "Tenant record created — receipt sealed",
                    "ProofLink namespace initialized",
                    "Daytona sandbox provisioning",
                    "Welcome email queued via /api/v1/notify",
                  ].map((line, i) => (
                    <motion.p
                      key={line}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.3 }}
                      className="flex items-center gap-2 py-1 text-xs text-muted"
                    >
                      <CheckCircle2 className="size-3.5 text-success" aria-hidden />
                      {line}
                    </motion.p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <p className="mt-4 text-center text-xs text-muted">
          Trial limits: 100 receipts/day · 5 containers · 30 days. Upgrade any time at
          billing.itechsmart.dev.
        </p>
      </div>
    </PageEnter>
  )
}

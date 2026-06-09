"use client"

// Interactive ROI calculator — sliders, live math, count-up results.
import * as React from "react"
import { motion } from "motion/react"
import { Calculator, TrendingUp } from "lucide-react"

import { CountUp } from "@/components/count-up"
import { PageEnter, PageHeader } from "@/components/page-header"
import { Badge, Card } from "@/components/ui"

function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  format,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  format: (v: number) => string
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <label className="text-muted">{label}</label>
        <span className="font-mono font-semibold tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="w-full accent-(--accent)"
      />
    </div>
  )
}

export default function RoiPage() {
  const [incidents, setIncidents] = React.useState(40)
  const [mttrManual, setMttrManual] = React.useState(45)
  const [hourlyRate, setHourlyRate] = React.useState(95)
  const [engineers, setEngineers] = React.useState(3)

  const MTTR_UAIO = 2.07
  const AUTONOMY = 0.94

  const minutesSaved = incidents * (mttrManual - MTTR_UAIO) * engineers
  const hoursSavedMonthly = (minutesSaved / 60) * AUTONOMY
  const dollarsMonthly = hoursSavedMonthly * hourlyRate
  const dollarsYearly = dollarsMonthly * 12
  const tierCost = 2799
  const roiPct = tierCost > 0 ? ((dollarsMonthly - tierCost) / tierCost) * 100 : 0

  return (
    <PageEnter>
      <PageHeader
        title="ROI Calculator"
        subtitle="Model your environment. The math updates live — MTTR 2.07 min and 94% autonomy are the platform's measured numbers, not projections."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card lift={false} className="space-y-6 p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Calculator className="size-4 text-accent" aria-hidden />
            Your environment
          </h2>
          <Slider
            label="Incidents per month"
            value={incidents}
            onChange={setIncidents}
            min={5}
            max={300}
            step={5}
            format={(v) => `${v}`}
          />
          <Slider
            label="Current MTTR (minutes)"
            value={mttrManual}
            onChange={setMttrManual}
            min={10}
            max={240}
            step={5}
            format={(v) => `${v} min`}
          />
          <Slider
            label="Engineers per incident"
            value={engineers}
            onChange={setEngineers}
            min={1}
            max={8}
            step={1}
            format={(v) => `${v}`}
          />
          <Slider
            label="Blended hourly rate"
            value={hourlyRate}
            onChange={setHourlyRate}
            min={40}
            max={250}
            step={5}
            format={(v) => `$${v}/hr`}
          />
          <p className="text-xs text-muted">
            Assumes UAIO MTTR of 2.07 minutes and 94% of incidents resolved without human time
            (Enterprise tier, $2,799/month).
          </p>
        </Card>

        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card className="bg-gradient-to-br from-its-purple to-its-purple-dark p-6 text-white">
              <p className="text-xs uppercase tracking-wider text-white/70">Estimated annual savings</p>
              <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight sm:text-5xl">
                $<CountUp value={Math.max(0, Math.round(dollarsYearly))} />
              </p>
              <Badge className="mt-3 bg-white/15 text-white">
                <TrendingUp className="size-3" aria-hidden />
                {Math.round(roiPct)}% monthly ROI vs Enterprise tier
              </Badge>
            </Card>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums">
                <CountUp value={Math.max(0, Math.round(hoursSavedMonthly))} />
              </p>
              <p className="mt-1 text-xs text-muted">engineer hours back per month</p>
            </Card>
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums">
                $<CountUp value={Math.max(0, Math.round(dollarsMonthly))} />
              </p>
              <p className="mt-1 text-xs text-muted">recovered per month</p>
            </Card>
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums">
                <CountUp value={Math.round(incidents * AUTONOMY)} />
              </p>
              <p className="mt-1 text-xs text-muted">incidents handled autonomously</p>
            </Card>
            <Card className="p-5">
              <p className="text-2xl font-bold tabular-nums">2.07</p>
              <p className="mt-1 text-xs text-muted">minutes MTTR — measured, sealed</p>
            </Card>
          </div>

          <Card lift={false} className="p-5 text-sm text-muted">
            Pricing: MSP <span className="font-semibold text-foreground">$699/mo</span> · Enterprise{" "}
            <span className="font-semibold text-foreground">$2,799/mo</span> — 30-day pilot with live
            ProofLink receipts of every number above.
          </Card>
        </div>
      </div>
    </PageEnter>
  )
}

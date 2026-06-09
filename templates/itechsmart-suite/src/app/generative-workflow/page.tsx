"use client"

// NL → workflow JSON builder — the demo "killer feature".
import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowDown, BookMarked, Network, Sparkles, Wand2 } from "lucide-react"

import { demoGenerateWorkflow, demoWorkflowLibrary, type GeneratedStep } from "@/lib/demo-suite"
import { timeAgo } from "@/lib/utils"
import { PageEnter, PageHeader } from "@/components/page-header"
import { useToast } from "@/components/toast"
import { Badge, Button, Card } from "@/components/ui"

const SUGGESTIONS = [
  "Every night back up postgres to R2 and seal a receipt",
  "When an incident resolves post a summary to Slack",
  "Restart octoai when health check fails twice",
  "Enrich every new lead with Apollo and alert sales",
]

export default function GenerativeWorkflowPage() {
  const [prompt, setPrompt] = React.useState("")
  const [generating, setGenerating] = React.useState(false)
  const [result, setResult] = React.useState<null | {
    name: string
    steps: GeneratedStep[]
    blastRadius: number
  }>(null)
  const toast = useToast()
  const library = demoWorkflowLibrary()

  const generate = (text: string) => {
    if (!text.trim()) {
      toast("error", "Describe the workflow first")
      return
    }
    setGenerating(true)
    setResult(null)
    // stands in for POST /api/v1/generative-workflow/generate
    setTimeout(() => {
      setResult(demoGenerateWorkflow(text.trim()))
      setGenerating(false)
    }, 1100)
  }

  return (
    <PageEnter>
      <PageHeader
        title="Generative Workflow"
        subtitle="Describe what should happen. Get an executable workflow with error handlers, a blast-radius check, and a ProofLink seal — every time."
      />

      <Card lift={false} className="p-6">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            generate(prompt)
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. when a pilot books on Calendly, create the Stripe tenant and welcome them on Slack"
            aria-label="Workflow description"
            className="h-11 flex-1 rounded-lg border border-edge bg-surface px-3 text-sm outline-none placeholder:text-muted-faint focus:border-accent focus-visible:outline-2 focus-visible:outline-accent"
          />
          <Button type="submit" loading={generating} className="h-11">
            <Wand2 className="size-4" aria-hidden />
            Generate
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setPrompt(s)
                generate(s)
              }}
              className="btn-press rounded-full border border-edge bg-surface px-3 py-1.5 text-xs text-muted hover:bg-accent-soft hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {/* Generated pipeline */}
      <AnimatePresence mode="wait">
        {generating && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card lift={false} className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-14 w-full" />
              ))}
            </Card>
          </motion.div>
        )}
        {result && (
          <motion.div
            key={result.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <Card lift={false} className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Sparkles className="size-4 text-accent" aria-hidden />
                <h2 className="text-sm font-semibold">{result.name}</h2>
                <Badge
                  className={
                    result.blastRadius > 3 ? "ml-auto bg-warning-soft text-warning" : "ml-auto bg-success-soft text-success"
                  }
                >
                  <Network className="size-3" aria-hidden />
                  blast radius: {result.blastRadius} node{result.blastRadius === 1 ? "" : "s"}
                </Badge>
              </div>
              <ol className="mt-5 space-y-1">
                {result.steps.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.12, duration: 0.3, ease: "easeOut" }}
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-3.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft font-mono text-xs font-semibold text-accent">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-sm">{step.action}</p>
                        <p className="text-xs text-muted">tool: {step.tool}</p>
                      </div>
                      <Badge className="bg-info-soft text-info shrink-0">on error: {step.onError}</Badge>
                    </div>
                    {i < result.steps.length - 1 && (
                      <div className="flex justify-center py-0.5">
                        <ArrowDown className="size-3.5 text-muted-faint" aria-hidden />
                      </div>
                    )}
                  </motion.li>
                ))}
              </ol>
              <div className="mt-5 flex gap-2">
                <Button
                  onClick={() => toast("success", "Workflow saved to genworkflow_library — receipt sealed")}
                >
                  Save to library
                </Button>
                <Button
                  variant="ghost"
                  onClick={() =>
                    result.blastRadius > 3
                      ? toast("error", "Blast radius > 3 — routed to Arbiter for SEMI_AUTO approval")
                      : toast("success", "Deployed to n8n — dry-run scheduled")
                  }
                >
                  Deploy
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Library */}
      <Card lift={false} className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <BookMarked className="size-4 text-accent" aria-hidden />
          <h2 className="text-sm font-semibold">Library</h2>
          <Badge className="bg-accent-soft text-accent">genworkflow_library</Badge>
        </div>
        <ul className="divide-y divide-edge">
          {library.map((w) => (
            <li key={w.prompt} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{w.prompt}</p>
                <p className="text-xs text-muted">
                  {w.steps} steps · blast radius {w.blastRadius} · saved {timeAgo(w.savedAt)}
                </p>
              </div>
              <Button variant="ghost" onClick={() => generate(w.prompt)}>
                Regenerate
              </Button>
            </li>
          ))}
        </ul>
      </Card>
    </PageEnter>
  )
}

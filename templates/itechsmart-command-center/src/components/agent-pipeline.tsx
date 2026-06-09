"use client"

// AG2 6-agent GroupChat pipeline visualization.
import { motion } from "motion/react"
import {
  Check,
  GitBranch,
  Radar,
  ShieldCheck,
  Stamp,
  Wrench,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

const AGENTS = [
  { name: "IncidentDetector", icon: Radar },
  { name: "DigitalTwinAnalyst", icon: GitBranch },
  { name: "RemediationPlanner", icon: Wrench },
  { name: "SecurityGatekeeper", icon: ShieldCheck },
  { name: "ExecutionAgent", icon: Zap },
  { name: "ProofLinkNotary", icon: Stamp },
] as const

export function AgentPipeline({ stage, compact }: { stage: number; compact?: boolean }) {
  return (
    <ol
      className={cn("flex items-center", compact ? "gap-1" : "gap-2")}
      aria-label={`AG2 pipeline: stage ${stage + 1} of 6`}
    >
      {AGENTS.map((agent, i) => {
        const done = i < stage
        const active = i === stage
        const Icon = agent.icon
        return (
          <li key={agent.name} className="flex items-center" title={agent.name}>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
              className={cn(
                "flex items-center justify-center rounded-full border",
                compact ? "size-6" : "size-8",
                done && "border-success/40 bg-success-soft text-success",
                active && "border-accent bg-accent text-white shadow-[0_0_12px_rgb(var(--glow)/0.5)]",
                !done && !active && "border-edge bg-surface text-muted-faint"
              )}
            >
              {done ? (
                <Check className={compact ? "size-3" : "size-3.5"} aria-hidden />
              ) : (
                <Icon className={compact ? "size-3" : "size-3.5"} aria-hidden />
              )}
            </motion.span>
            {i < AGENTS.length - 1 && (
              <span
                className={cn(
                  "h-px",
                  compact ? "w-2" : "w-4",
                  i < stage ? "bg-success" : "bg-edge-strong"
                )}
                aria-hidden
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

export { AGENTS }

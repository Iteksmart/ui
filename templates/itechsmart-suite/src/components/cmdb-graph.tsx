"use client"

// Interactive CMDB force graph — d3-force simulation rendered as SVG.
// Click a node to compute its blast radius (everything that depends on it).
import * as React from "react"
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from "d3-force"

import { blastRadius, type CmdbGraph, type GraphNode } from "@/lib/demo-suite"
import { cn } from "@/lib/utils"

type SimNode = GraphNode & SimulationNodeDatum
type SimLink = SimulationLinkDatum<SimNode>

const TYPE_COLOR: Record<GraphNode["type"], string> = {
  service: "var(--info)",
  database: "var(--warning)",
  container: "var(--accent)",
  network: "var(--success)",
  external: "var(--muted-faint)",
}

export function CmdbGraphView({
  graph,
  selected,
  onSelect,
  height = 460,
}: {
  graph: CmdbGraph
  selected: string | null
  onSelect: (id: string | null) => void
  height?: number
}) {
  const width = 880
  const [nodes, setNodes] = React.useState<SimNode[]>([])
  const [links, setLinks] = React.useState<SimLink[]>([])
  const simRef = React.useRef<ReturnType<typeof forceSimulation<SimNode>> | null>(null)
  const dragRef = React.useRef<{ node: SimNode; svg: SVGSVGElement } | null>(null)

  React.useEffect(() => {
    const simNodes: SimNode[] = graph.nodes.map((n) => ({ ...n }))
    const simLinks: SimLink[] = graph.edges.map((e) => ({ source: e.source, target: e.target }))
    const sim = forceSimulation(simNodes)
      .force("charge", forceManyBody().strength(-380))
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "link",
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(92)
      )
      .force("collide", forceCollide(34))
      .on("tick", () => {
        setNodes([...simNodes])
        setLinks([...simLinks])
      })
    simRef.current = sim
    return () => {
      sim.stop()
    }
  }, [graph, height])

  const impacted = React.useMemo(
    () => (selected ? blastRadius(graph, selected) : null),
    [graph, selected]
  )

  const toLocal = (svg: SVGSVGElement, clientX: number, clientY: number) => {
    const rect = svg.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    }
  }

  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current
    if (!drag) return
    const { x, y } = toLocal(drag.svg, e.clientX, e.clientY)
    drag.node.fx = x
    drag.node.fy = y
    simRef.current?.alpha(0.4).restart()
  }

  const endDrag = () => {
    if (dragRef.current) {
      dragRef.current.node.fx = null
      dragRef.current.node.fy = null
      dragRef.current = null
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full touch-none select-none rounded-xl border border-edge bg-surface"
      role="img"
      aria-label="CMDB dependency graph"
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onClick={() => onSelect(null)}
    >
      {links.map((l, i) => {
        const s = l.source as SimNode
        const t = l.target as SimNode
        const hot = impacted ? impacted.has(s.id) && impacted.has(t.id) : false
        return (
          <line
            key={i}
            x1={s.x}
            y1={s.y}
            x2={t.x}
            y2={t.y}
            stroke={hot ? "var(--danger)" : "var(--border-strong)"}
            strokeWidth={hot ? 2 : 1}
            strokeOpacity={impacted && !hot ? 0.25 : 0.8}
          />
        )
      })}
      {nodes.map((n) => {
        const inBlast = impacted?.has(n.id) ?? false
        const dimmed = impacted ? !inBlast : false
        const isSelected = n.id === selected
        return (
          <g
            key={n.id}
            transform={`translate(${n.x ?? 0},${n.y ?? 0})`}
            className="cursor-pointer"
            opacity={dimmed ? 0.3 : 1}
            onClick={(e) => {
              e.stopPropagation()
              onSelect(isSelected ? null : n.id)
            }}
            onPointerDown={(e) => {
              e.stopPropagation()
              dragRef.current = { node: n, svg: e.currentTarget.ownerSVGElement! }
            }}
          >
            {isSelected && (
              <circle r={22} fill="none" stroke="var(--danger)" strokeWidth={2} strokeDasharray="4 3" />
            )}
            <circle
              r={n.critical ? 15 : 11}
              fill={inBlast && !isSelected ? "var(--danger)" : TYPE_COLOR[n.type]}
              fillOpacity={0.9}
              stroke="var(--surface)"
              strokeWidth={2}
            />
            <text
              y={n.critical ? 30 : 25}
              textAnchor="middle"
              className={cn("font-mono", isSelected && "font-bold")}
              fontSize={10.5}
              fill="var(--foreground)"
            >
              {n.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function GraphLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
      {(Object.keys(TYPE_COLOR) as GraphNode["type"][]).map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: TYPE_COLOR[t] }} />
          {t}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-danger" />
        blast radius
      </span>
    </div>
  )
}

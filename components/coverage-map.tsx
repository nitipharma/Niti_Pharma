"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface CoverageMapProps {
  states: string[]
  selectedState?: string | null
  onStateClick: (state: string) => void
}

// Simplified India map with major states as clickable regions
// This is a simplified representation for demo purposes
export function CoverageMap({ states, selectedState, onStateClick }: CoverageMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [hoveredState, setHoveredState] = useState<string | null>(null)

  // State paths - simplified representation
  const statePaths: Record<string, { path: string; transform?: string }> = {
    "Maharashtra": { path: "M 200 300 L 250 280 L 280 320 L 240 350 Z" },
    "Delhi": { path: "M 180 200 L 200 195 L 205 210 L 185 215 Z" },
    "Karnataka": { path: "M 220 400 L 280 380 L 300 420 L 240 440 Z" },
    "Tamil Nadu": { path: "M 240 480 L 300 470 L 310 510 L 250 520 Z" },
    "Gujarat": { path: "M 120 280 L 180 260 L 200 300 L 140 320 Z" },
    "Rajasthan": { path: "M 100 200 L 180 180 L 200 240 L 120 260 Z" },
    "West Bengal": { path: "M 280 280 L 340 270 L 350 310 L 290 320 Z" },
    "Uttar Pradesh": { path: "M 150 240 L 220 220 L 240 280 L 170 300 Z" },
    "Telangana": { path: "M 200 360 L 250 350 L 260 380 L 210 390 Z" },
    "Kerala": { path: "M 200 450 L 240 445 L 245 470 L 205 475 Z" },
    "Punjab": { path: "M 140 180 L 180 175 L 185 200 L 145 205 Z" },
    "Haryana": { path: "M 160 200 L 190 195 L 195 215 L 165 220 Z" },
    "Madhya Pradesh": { path: "M 140 300 L 200 280 L 220 340 L 160 360 Z" },
    "Odisha": { path: "M 240 340 L 300 330 L 310 370 L 250 380 Z" },
    "Andhra Pradesh": { path: "M 220 380 L 280 370 L 290 410 L 230 420 Z" },
  }

  const prefersReducedMotion = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    prefersReducedMotion.current = mediaQuery.matches

    const handleChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion.current = e.matches
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const handleStateClick = (state: string) => {
    if (prefersReducedMotion.current) {
      onStateClick(state)
      return
    }

    // Smooth scroll to table row
    const rowId = `state-${state.toLowerCase().replace(/\s+/g, "-")}`
    const row = document.getElementById(rowId)
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" })
      // Highlight briefly
      row.classList.add("bg-primary/10")
      setTimeout(() => {
        row.classList.remove("bg-primary/10")
      }, 2000)
    }
    onStateClick(state)
  }

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        viewBox="0 0 400 600"
        className="w-full h-auto max-h-[500px]"
        role="img"
        aria-label="India coverage map"
      >
        <title>India Service Coverage Map</title>
        <desc>Interactive map showing states where Niti Pharma provides service coverage</desc>
        
        {/* Background */}
        <rect width="400" height="600" fill="#f8fafc" className="stroke-border" strokeWidth="2" />
        
        {/* State paths */}
        {Object.entries(statePaths).map(([state, { path, transform }]) => {
          const isCovered = states.includes(state)
          const isSelected = selectedState === state
          const isHovered = hoveredState === state

          if (!isCovered) return null

          return (
            <path
              key={state}
              d={path}
              transform={transform}
              fill={
                isSelected
                  ? "hsl(var(--primary))"
                  : isHovered
                  ? "hsl(var(--primary) / 0.7)"
                  : "hsl(var(--primary) / 0.3)"
              }
              stroke="hsl(var(--primary))"
              strokeWidth={isSelected ? "3" : "1.5"}
              className={cn(
                "cursor-pointer",
                !prefersReducedMotion.current && "transition-all duration-200"
              )}
              onClick={() => handleStateClick(state)}
              onMouseEnter={() => setHoveredState(state)}
              onMouseLeave={() => setHoveredState(null)}
              onFocus={() => setHoveredState(state)}
              onBlur={() => setHoveredState(null)}
              tabIndex={0}
              role="button"
              aria-label={`${state} - Click to view details`}
              aria-pressed={isSelected}
            >
              <title>{state}</title>
            </path>
          )
        })}

        {/* Labels for major states */}
        {Object.entries(statePaths).map(([state, { path }]) => {
          if (!states.includes(state)) return null
          
          // Calculate center for label (simplified)
          const bounds = path.match(/[\d.]+/g)?.map(Number) || []
          if (bounds.length < 4) return null
          
          const x = bounds.slice(0, bounds.length / 2).reduce((a, b) => a + b, 0) / (bounds.length / 2)
          const y = bounds.slice(bounds.length / 2).reduce((a, b) => a + b, 0) / (bounds.length / 2)

          return (
            <text
              key={`label-${state}`}
              x={x}
              y={y}
              fontSize="10"
              fill="hsl(var(--foreground))"
              textAnchor="middle"
              dominantBaseline="middle"
              className="pointer-events-none select-none"
              aria-hidden="true"
            >
              {state.length > 8 ? state.substring(0, 8) : state}
            </text>
          )
        })}
      </svg>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Click on a highlighted state to view coverage details
      </p>
    </div>
  )
}


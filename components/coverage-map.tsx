"use client"

import { MapPin, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CoverageMapProps {
  states: string[]
  selectedState?: string | null
  onStateClick: (state: string) => void
}

/**
 * Interactive grid of covered states. Selecting a state highlights it and
 * scrolls the coverage table (handled by the parent page) to its row.
 */
export function CoverageMap({ states, selectedState, onStateClick }: CoverageMapProps) {
  return (
    <div className="w-full">
      <div
        role="listbox"
        aria-label="Covered states"
        className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5"
      >
        {states.map((state) => {
          const isSelected = selectedState === state
          return (
            <button
              key={state}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onStateClick(state)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary/40 bg-accent text-accent-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              {isSelected ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              ) : (
                <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className="truncate">{state}</span>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Select a state to jump to its coverage details below.
      </p>
    </div>
  )
}

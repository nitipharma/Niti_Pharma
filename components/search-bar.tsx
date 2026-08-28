"use client"

import { Input } from "@/components/ui/input"
import { Search, Sparkles } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** When provided, renders the on-device AI search toggle */
  aiMode?: boolean
  onAiModeChange?: (enabled: boolean) => void
  /** Status line rendered under the input while AI mode is active */
  aiStatus?: string | null
}

export function SearchBar({
  value,
  onChange,
  placeholder,
  aiMode = false,
  onAiModeChange,
  aiStatus,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleChange = (val: string) => {
    setLocalValue(val)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      onChange(val)
    }, 300)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const effectivePlaceholder =
    placeholder ??
    (aiMode
      ? 'Describe what you need — e.g. "syrup for children\'s fever"'
      : "Search products...")

  return (
    <div>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder={effectivePlaceholder}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className={cn("pl-9", onAiModeChange && "pr-24")}
          aria-label="Search products"
        />
        {onAiModeChange && (
          <button
            type="button"
            onClick={() => onAiModeChange(!aiMode)}
            aria-pressed={aiMode}
            title={
              aiMode
                ? "AI search on — ranking by meaning, on-device"
                : "Turn on AI search — describe what you need in plain words"
            }
            className={cn(
              "absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              aiMode
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            AI
          </button>
        )}
      </div>
      {aiMode && aiStatus && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" aria-hidden />
          {aiStatus}
        </p>
      )}
    </div>
  )
}

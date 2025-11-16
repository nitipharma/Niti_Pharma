"use client"

import { useEffect } from "react"
import { DiagnosticsModal } from "./diagnostics-modal"
import { useState } from "react"
import { trackFirstLoad } from "@/lib/metrics"

export function DiagnosticsProvider() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Track first load
    trackFirstLoad()

    // Keyboard shortcut: Ctrl+Shift+D or Cmd+Shift+D
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "D") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return <DiagnosticsModal open={open} onOpenChange={setOpen} />
}


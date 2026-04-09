"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

/** Avoids Recharts ResponsiveContainer SSR width/height -1 warnings during static generation. */
export function ChartShell({
  className,
  heightClass = "h-[260px]",
  children,
}: {
  className?: string
  heightClass?: string
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return (
      <div
        className={cn(
          "w-full min-w-0 animate-pulse rounded-lg bg-muted/40",
          heightClass,
          className
        )}
      />
    )
  }
  return <div className={cn("w-full min-w-0", heightClass, className)}>{children}</div>
}

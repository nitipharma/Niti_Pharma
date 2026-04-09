"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import { ShipmentStatusBadge } from "@/components/platform/status-badges"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Shipment } from "@/types/platform"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

function buildUrl(filter: "all" | "in_transit" | "delayed", refresh: number) {
  const qs = new URLSearchParams()
  if (filter !== "all") qs.set("filter", filter)
  qs.set("_refresh", String(refresh))
  return `/api/shipments?${qs.toString()}`
}

export function TrackingPageClient() {
  const [filter, setFilter] = useState<"all" | "in_transit" | "delayed">("all")
  const [openId, setOpenId] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1)
    }, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const url = useMemo(() => buildUrl(filter, tick), [filter, tick])
  const { data, loading, error } = useDemoFetch<Shipment[]>(url)

  return (
    <div className="container max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Delivery tracking</h1>
          <p className="text-sm text-muted-foreground">
            Carrier milestones refresh every 30 seconds.
          </p>
        </div>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as typeof filter)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All active</SelectItem>
            <SelectItem value="in_transit">In transit only</SelectItem>
            <SelectItem value="delayed">Delayed only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="w-8 px-2" />
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Dispatch</th>
                    <th className="px-4 py-3 font-medium">ETA</th>
                    <th className="px-4 py-3 font-medium">Carrier</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((s) => {
                    const delayed = s.status.toLowerCase() === "delayed"
                    const expanded = openId === s.id
                    return (
                      <Fragment key={s.id}>
                        <tr
                          className={cn(
                            "border-b border-border/50",
                            delayed && "bg-amber-500/5"
                          )}
                        >
                          <td className="px-2 py-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-expanded={expanded}
                              onClick={() =>
                                setOpenId(expanded ? null : s.id)
                              }
                            >
                              {expanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">
                            {s.orderId}
                          </td>
                          <td className="px-4 py-2">{s.customerName}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(s.dispatchDate).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {new Date(s.eta).toLocaleString()}
                          </td>
                          <td className="px-4 py-2">{s.carrier}</td>
                          <td className="px-4 py-2">
                            <ShipmentStatusBadge status={s.status} />
                          </td>
                          <td className="px-4 py-2 w-[140px]">
                            <Progress value={s.progress} className="h-2" />
                          </td>
                        </tr>
                        {expanded && (
                          <tr className="bg-muted/20">
                            <td colSpan={8} className="px-4 py-4">
                              <p className="mb-3 text-xs font-medium text-muted-foreground">
                                Route checkpoints
                              </p>
                              <ol className="relative space-y-3 border-l border-border pl-6">
                                {s.waypoints.map((w, i) => (
                                  <li key={i} className="relative text-sm">
                                    <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-primary" />
                                    <p>{w.label}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(w.at).toLocaleString()}
                                    </p>
                                  </li>
                                ))}
                              </ol>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

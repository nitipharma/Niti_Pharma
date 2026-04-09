"use client"

import { useCallback, useMemo, useState } from "react"
import { useDemoFetch } from "@/hooks/use-demo-fetch"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { ShipmentStatusBadge } from "@/components/platform/status-badges"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Shipment } from "@/types/platform"
import { useToast } from "@/components/ui/use-toast"

type ShipmentRow = Shipment & { orderId: string }

const STATUS_OPTIONS = [
  { value: "in_transit", label: "In transit" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "delayed", label: "Delayed" },
] as const

function buildUrl() {
  return `/api/shipments?filter=all&_refresh=${Date.now()}`
}

export function TrackingManageClient() {
  const { toast } = useToast()
  const [url, setUrl] = useState(buildUrl)
  const { data, loading, error } = useDemoFetch<ShipmentRow[]>(url)

  const refresh = useCallback(() => {
    setUrl(buildUrl())
  }, [])

  const rows = useMemo(() => data ?? [], [data])

  const [busy, setBusy] = useState<string | null>(null)
  const [wayLoc, setWayLoc] = useState<Record<string, string>>({})
  const [wayNote, setWayNote] = useState<Record<string, string>>({})

  const onStatus = async (orderId: string, status: string) => {
    setBusy(orderId)
    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderId)}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Update failed",
          description: "Could not change order status.",
        })
        return
      }
      toast({ title: "Status updated", description: orderId })
      refresh()
    } catch {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Network error.",
      })
    } finally {
      setBusy(null)
    }
  }

  const onWaypoint = async (shipmentId: string, orderId: string) => {
    const location = wayLoc[shipmentId]?.trim() ?? ""
    const note = wayNote[shipmentId]?.trim() ?? ""
    if (!location || !note) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Enter location and note.",
      })
      return
    }
    setBusy(shipmentId)
    try {
      const res = await fetch(
        `/api/shipments/${encodeURIComponent(shipmentId)}/waypoint`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location,
            note,
            status: "in_transit",
          }),
        }
      )
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Could not add waypoint",
        })
        return
      }
      toast({ title: "Waypoint added", description: orderId })
      setWayLoc((m) => ({ ...m, [shipmentId]: "" }))
      setWayNote((m) => ({ ...m, [shipmentId]: "" }))
      refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="container max-w-7xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Shipment management</h1>
        <p className="text-sm text-muted-foreground">
          Update order status and carrier waypoints (admin).
        </p>
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
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Carrier</th>
                    <th className="px-4 py-3 font-medium">Dispatched</th>
                    <th className="px-4 py-3 font-medium">ETA</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr key={s.id} className="border-b border-border/50">
                      <td className="px-4 py-2 font-mono text-xs">{s.orderId}</td>
                      <td className="px-4 py-2">{s.customerName}</td>
                      <td className="px-4 py-2">{s.carrier}</td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(s.dispatchDate).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {new Date(s.eta).toLocaleString()}
                      </td>
                      <td className="px-4 py-2">
                        <ShipmentStatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <Select
                            disabled={busy === s.orderId}
                            onValueChange={(v) => void onStatus(s.orderId, v)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Update status" />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="Waypoint location"
                            className="h-8 text-xs"
                            value={wayLoc[s.id] ?? ""}
                            onChange={(e) =>
                              setWayLoc((m) => ({
                                ...m,
                                [s.id]: e.target.value,
                              }))
                            }
                          />
                          <Input
                            placeholder="Waypoint note"
                            className="h-8 text-xs"
                            value={wayNote[s.id] ?? ""}
                            onChange={(e) =>
                              setWayNote((m) => ({
                                ...m,
                                [s.id]: e.target.value,
                              }))
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy === s.id}
                            onClick={() => void onWaypoint(s.id, s.orderId)}
                          >
                            Add waypoint
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

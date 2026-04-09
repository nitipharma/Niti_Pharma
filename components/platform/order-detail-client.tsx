"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { OrderStatusBadge } from "@/components/platform/status-badges"
import { useToast } from "@/components/ui/use-toast"
import type { SerializedOrder } from "@/lib/serializers/order"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { CheckCircle2, Circle } from "lucide-react"

type DocRef = {
  id: string
  type: string
  status: string
  uploadedAt: string
}

type ShipmentRow = {
  id: string
  status: string
  dispatchedAt: string | null
  estimatedDelivery: Date | string | null
}

type OrderDetailPayload = SerializedOrder & {
  documents: DocRef[]
  shipments: ShipmentRow[]
}

function buildTimeline(order: SerializedOrder, docs: DocRef[], ship: ShipmentRow | null) {
  const st = order.status.toLowerCase()
  const hasPo = docs.some((d) => d.type === "purchase_order")
  const hasInv = docs.some((d) => d.type === "invoice")
  const hasDr = docs.some((d) => d.type === "delivery_record")

  const poDoc = docs.find((d) => d.type === "purchase_order")

  const steps: {
    id: string
    label: string
    at: string
    completed: boolean
  }[] = [
    {
      id: "placed",
      label: "Order placed",
      at: order.placedAt,
      completed: true,
    },
    {
      id: "po",
      label: "PO issued",
      at: poDoc?.uploadedAt ?? order.placedAt,
      completed: hasPo,
    },
    {
      id: "inv",
      label: "Invoice on file",
      at:
        docs.find((d) => d.type === "invoice")?.uploadedAt ?? order.placedAt,
      completed: hasInv,
    },
    {
      id: "delrec",
      label: "Delivery record",
      at:
        docs.find((d) => d.type === "delivery_record")?.uploadedAt ??
        order.placedAt,
      completed: hasDr,
    },
    {
      id: "ship",
      label: "Dispatched",
      at: ship?.dispatchedAt ?? order.placedAt,
      completed:
        [
          "dispatched",
          "in_transit",
          "out_for_delivery",
          "delivered",
          "delayed",
        ].includes(st) && !!ship?.dispatchedAt,
    },
    {
      id: "done",
      label: "Delivered",
      at: order.placedAt,
      completed: st === "delivered",
    },
  ]
  return steps
}

function fmtDocType(t: string) {
  return t.replace(/_/g, " ")
}

export function OrderDetailClient({
  orderId,
  canEditAsAdmin,
}: {
  orderId: string
  canEditAsAdmin: boolean
}) {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const [data, setData] = useState<OrderDetailPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editNotes, setEditNotes] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editPriority, setEditPriority] = useState<
    "standard" | "urgent" | "scheduled"
  >("standard")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`)
      if (res.status === 404) {
        setError("Order not found.")
        setData(null)
        return
      }
      if (!res.ok) throw new Error("load")
      const json = (await res.json()) as OrderDetailPayload
      setData(json)
      setEditNotes(json.notes ?? "")
      setEditDate(json.requiredDate.slice(0, 10))
      setEditPriority(
        (json.priority as "standard" | "urgent" | "scheduled") ?? "standard"
      )
    } catch {
      setError("Could not load order.")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      toast({
        title: "Order created",
        description: "Your order was submitted successfully.",
      })
    }
  }, [searchParams, toast])

  const timeline = useMemo(() => {
    if (!data) return []
    const ship = data.shipments?.[0] ?? null
    return buildTimeline(data, data.documents ?? [], ship)
  }, [data])

  const onSaveEdit = async () => {
    if (!data || data.status !== "processing" || !canEditAsAdmin) return
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: editNotes,
          requiredDate: new Date(editDate).toISOString(),
          priority: editPriority,
        }),
      })
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Could not save",
          description: "Try again or check permissions.",
        })
        return
      }
      const json = (await res.json()) as SerializedOrder
      setData((prev) =>
        prev
          ? {
              ...prev,
              ...json,
              documents: prev.documents,
              shipments: prev.shipments,
            }
          : prev
      )
      toast({ title: "Saved", description: "Order updated." })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="container max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-destructive">{error ?? "Not found"}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/orders">Back to orders</Link>
        </Button>
      </div>
    )
  }

  const order = data
  const excLinked = order.status === "exception"

  return (
    <div className="container max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Order</p>
          <h1 className="font-mono text-2xl font-bold">{order.id}</h1>
          <p className="mt-1 text-muted-foreground">{order.customerName}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            {excLinked && (
              <Badge
                variant="outline"
                className="border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200"
              >
                Exception linked
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right text-sm">
          <p className="text-muted-foreground">Placed</p>
          <p>{new Date(order.placedAt).toLocaleString()}</p>
          <p className="mt-2 text-muted-foreground">Total</p>
          <p className="text-xl font-semibold">
            $
            {order.totalAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link
            href={`/reconciliation?highlight=${encodeURIComponent(order.id)}`}
          >
            View reconciliation
          </Link>
        </Button>
      </div>

      {canEditAsAdmin && order.status === "processing" && (
          <Card className="w-full border-dashed">
            <CardHeader className="py-3">
              <CardTitle className="text-sm">Edit order (admin)</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="n">Notes</Label>
                <Textarea
                  id="n"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rd">Required date</Label>
                <Input
                  id="rd"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={editPriority}
                  onValueChange={(v) =>
                    setEditPriority(v as typeof editPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  size="sm"
                  disabled={saving}
                  onClick={() => void onSaveEdit()}
                >
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line items</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Ordered</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.lineItems.map((li, i) => (
                <TableRow key={i}>
                  <TableCell>{li.productName}</TableCell>
                  <TableCell className="text-right">{li.orderedQty}</TableCell>
                  <TableCell className="text-right">{li.deliveredQty}</TableCell>
                  <TableCell className="text-right">
                    ${li.unitPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${li.lineTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linked documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {(order.documents ?? []).length === 0 ? (
              <li className="text-muted-foreground">None yet.</li>
            ) : (
              order.documents.map((d) => (
                <li
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 py-2 last:border-0"
                >
                  <span>
                    <span className="font-mono text-xs">{d.id}</span>{" "}
                    <span className="text-muted-foreground">
                      ({fmtDocType(d.type)})
                    </span>
                  </span>
                  <Button variant="link" className="h-auto p-0" asChild>
                    <Link href={`/documents/${encodeURIComponent(d.id)}`}>
                      Open
                    </Link>
                  </Button>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {timeline.map((step) => (
              <li key={step.id} className="relative">
                <span className="absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full bg-background">
                  {step.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
                <p className="font-medium">{step.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(step.at).toLocaleString()}
                </p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}

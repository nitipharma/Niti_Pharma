import type { Customer, Order, Shipment } from "@prisma/client"
import type { Shipment as UiShipment } from "@/types/platform"

type Wp = {
  timestamp?: string
  location?: string
  note?: string
  status?: string
}

function titleCaseStatus(s: string): string {
  const x = s.toLowerCase().replace(/_/g, " ")
  return x.replace(/\b\w/g, (c) => c.toUpperCase())
}

function progressFor(status: string): number {
  const u = status.toLowerCase()
  if (u === "delivered") return 100
  if (u === "out_for_delivery") return 85
  if (u === "in_transit") return 60
  if (u === "delayed") return 40
  if (u === "dispatched") return 35
  return 20
}

export function serializeShipment(
  s: Shipment & { order: Order & { customer: Customer } }
): UiShipment {
  const raw = s.waypoints
  const arr: Wp[] = Array.isArray(raw) ? (raw as Wp[]) : []

  return {
    id: s.id,
    orderId: s.orderId,
    customerId: s.order.customerId,
    customerName: s.order.customer.name,
    dispatchDate: (s.dispatchedAt ?? s.createdAt).toISOString(),
    eta: (s.estimatedDelivery ?? s.createdAt).toISOString(),
    carrier: s.carrier as UiShipment["carrier"],
    status: titleCaseStatus(s.status) as UiShipment["status"],
    progress: progressFor(s.status),
    waypoints: arr.map((w) => ({
      label:
        [w.location, w.note].filter(Boolean).join(" · ") ||
        w.status ||
        "Update",
      at: w.timestamp ?? new Date().toISOString(),
    })),
  }
}

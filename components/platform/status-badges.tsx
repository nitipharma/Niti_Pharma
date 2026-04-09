import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DocumentStatus, ExceptionStatus } from "@/types/platform"

function getOrderTone(status: string): "success" | "warning" | "danger" | "info" {
  const s = status.toLowerCase()
  if (s === "delivered") return "success"
  if (s === "exception") return "danger"
  if (s === "delayed") return "danger"
  if (s === "processing") return "info"
  if (s === "dispatched" || s === "in_transit" || s === "out_for_delivery")
    return "warning"
  return "info"
}

function formatOrderStatus(status: string): string {
  const map: Record<string, string> = {
    processing: "Processing",
    dispatched: "Dispatched",
    in_transit: "In Transit",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    delayed: "Delayed",
    exception: "Exception",
  }
  return map[status.toLowerCase()] ?? status
}

const docTone: Record<
  DocumentStatus,
  "success" | "warning" | "danger" | "info"
> = {
  Validated: "success",
  Extracted: "info",
  Mismatch: "danger",
  Pending: "warning",
}

const excTone: Record<ExceptionStatus, "success" | "warning" | "danger" | "info"> =
  {
    Resolved: "success",
    Open: "warning",
    "Under Review": "warning",
    Escalated: "danger",
  }

const toneClass: Record<
  "success" | "warning" | "danger" | "info",
  string
> = {
  success:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  warning:
    "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-100",
  danger: "border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
  info: "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-100",
}

export function OrderStatusBadge({ status }: { status: string }) {
  const t = getOrderTone(status)
  return (
    <Badge variant="outline" className={cn("font-normal", toneClass[t])}>
      {formatOrderStatus(status)}
    </Badge>
  )
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const t = docTone[status]
  const label =
    status === "Extracted"
      ? "Extracted ✓"
      : status === "Validated"
        ? "Validated ✓"
        : status === "Mismatch"
          ? "Mismatch ⚠"
          : "Pending"
  return (
    <Badge variant="outline" className={cn("font-normal", toneClass[t])}>
      {label}
    </Badge>
  )
}

export function ExceptionStatusBadge({ status }: { status: ExceptionStatus }) {
  const t = excTone[status]
  return (
    <Badge variant="outline" className={cn("font-normal", toneClass[t])}>
      {status}
    </Badge>
  )
}

export function ShipmentStatusBadge({
  status,
}: {
  status: string
}) {
  const t =
    status.toLowerCase() === "delivered"
      ? "success"
      : status.toLowerCase() === "delayed"
        ? "danger"
        : status.toLowerCase() === "in transit" ||
            status.toLowerCase() === "out for delivery"
          ? "warning"
          : "info"
  return (
    <Badge variant="outline" className={cn("font-normal", toneClass[t])}>
      {status}
    </Badge>
  )
}

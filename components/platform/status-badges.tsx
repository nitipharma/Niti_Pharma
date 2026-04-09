import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { DocumentStatus, OrderStatus, ExceptionStatus } from "@/types/platform"

const orderTone: Record<
  OrderStatus,
  "success" | "warning" | "danger" | "info"
> = {
  Delivered: "success",
  "In Transit": "warning",
  Processing: "info",
  Exception: "danger",
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

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const t = orderTone[status]
  return (
    <Badge variant="outline" className={cn("font-normal", toneClass[t])}>
      {status}
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
    status === "Delivered"
      ? "success"
      : status === "Delayed"
        ? "danger"
        : status === "In Transit" || status === "Out for Delivery"
          ? "warning"
          : "info"
  return (
    <Badge variant="outline" className={cn("font-normal", toneClass[t])}>
      {status}
    </Badge>
  )
}

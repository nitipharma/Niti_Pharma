import type { ReconciliationRecord } from "@/types/platform"

export type OrderCsvRow = {
  id: string
  customerName: string
  placedAt: string
  status: string
  productCategory: string
  totalAmount: number
}

export function exportOrdersCsv(orders: OrderCsvRow[]): string {
  const headers = [
    "Order ID",
    "Customer",
    "Date",
    "Status",
    "Category",
    "Total",
  ]
  const rows = orders.map((o) => [
    o.id,
    `"${o.customerName.replace(/"/g, '""')}"`,
    o.placedAt,
    o.status,
    o.productCategory,
    String(o.totalAmount),
  ])
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
}

export function exportReconciliationCsv(rows: ReconciliationRecord[]): string {
  const headers = [
    "Order ID",
    "PO Matched",
    "Invoice Matched",
    "Delivery Matched",
    "Status",
  ]
  const lines = rows.map((r) =>
    [
      r.orderId,
      r.poMatched ? "Yes" : "No",
      r.invoiceMatched ? "Yes" : "No",
      r.deliveryMatched ? "Yes" : "No",
      r.status,
    ].join(",")
  )
  return [headers.join(","), ...lines].join("\n")
}

export function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

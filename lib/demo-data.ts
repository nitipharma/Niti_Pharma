import customersJson from "@/data/customers.json"
import ordersJson from "@/data/orders.json"
import documentsJson from "@/data/documents.json"
import exceptionsJson from "@/data/exceptions.json"
import shipmentsJson from "@/data/shipments.json"
import { seededRandom, seededFloat } from "@/lib/seedrandom"
import type {
  Customer,
  Document,
  DocumentStatus,
  DocumentType,
  ExceptionRecord,
  ExceptionStatus,
  ExceptionType,
  Order,
  OrderStatus,
  ReconciliationRecord,
  Shipment,
  DashboardMetrics,
  DashboardTimeSeriesPoint,
  DocumentVolumeByType,
  TopCustomerVolume,
  OrderTimelineStep,
  CustomerBillingInvoice,
} from "@/types/platform"

const customers = customersJson as Customer[]
const orders = ordersJson as Order[]
const documents = documentsJson as Document[]
const exceptions = exceptionsJson as ExceptionRecord[]
const shipments = shipmentsJson as Shipment[]

export type OrderListFilters = {
  search?: string
  status?: OrderStatus | "all"
  dateRange?: "7" | "30" | "90" | "all"
  sort?: "date" | "amount" | "status"
  sortDir?: "asc" | "desc"
}

export type DocumentListFilters = {
  type?: DocumentType | "all"
  status?: DocumentStatus | "all"
  search?: string
}

export type ExceptionListFilters = {
  type?: ExceptionType | "all"
  status?: ExceptionStatus | "all"
  dateRange?: "7" | "30" | "90" | "all"
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function isInMonth(iso: string, ref: Date): boolean {
  const t = new Date(iso)
  return t.getFullYear() === ref.getFullYear() && t.getMonth() === ref.getMonth()
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

function parseDay(iso: string): string {
  return iso.slice(0, 10)
}

export function getCustomers(): Customer[] {
  return customers
}

export function getCustomerById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id)
}

export function getOrders(filters?: OrderListFilters): Order[] {
  let list = [...orders]
  const f = filters ?? {}
  if (f.search) {
    const q = f.search.toLowerCase()
    list = list.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q)
    )
  }
  if (f.status && f.status !== "all") {
    list = list.filter((o) => o.status === f.status)
  }
  if (f.dateRange && f.dateRange !== "all") {
    const days = f.dateRange === "7" ? 7 : f.dateRange === "30" ? 30 : 90
    const since = daysAgo(days)
    list = list.filter((o) => new Date(o.placedAt) >= since)
  }
  const sort = f.sort ?? "date"
  const dir = f.sortDir === "asc" ? 1 : -1
  list.sort((a, b) => {
    if (sort === "amount") return (a.totalAmount - b.totalAmount) * dir
    if (sort === "status") return a.status.localeCompare(b.status) * dir
    return (new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()) * dir
  })
  return list
}

export function getOrderById(id: string): Order | undefined {
  return orders.find((o) => o.id === id)
}

export function getDocuments(filters?: DocumentListFilters): Document[] {
  let list = [...documents]
  const f = filters ?? {}
  if (f.type && f.type !== "all") {
    list = list.filter((d) => d.type === f.type)
  }
  if (f.status && f.status !== "all") {
    list = list.filter((d) => d.status === f.status)
  }
  if (f.search) {
    const q = f.search.toLowerCase()
    list = list.filter(
      (d) =>
        d.id.toLowerCase().includes(q) ||
        d.vendorOrCustomer.toLowerCase().includes(q) ||
        (d.matchedOrderId?.toLowerCase().includes(q) ?? false)
    )
  }
  return list.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

export function getDocumentById(id: string): Document | undefined {
  return documents.find((d) => d.id === id)
}

export function getDocumentsForOrder(orderId: string): Document[] {
  return documents.filter((d) => d.matchedOrderId === orderId)
}

export function getExceptions(filters?: ExceptionListFilters): ExceptionRecord[] {
  let list = [...exceptions]
  const f = filters ?? {}
  if (f.type && f.type !== "all") {
    list = list.filter((e) => e.type === f.type)
  }
  if (f.status && f.status !== "all") {
    list = list.filter((e) => e.status === f.status)
  }
  if (f.dateRange && f.dateRange !== "all") {
    const days = f.dateRange === "7" ? 7 : f.dateRange === "30" ? 30 : 90
    const since = daysAgo(days)
    list = list.filter((e) => new Date(e.dateFlagged) >= since)
  }
  return list.sort(
    (a, b) =>
      new Date(b.dateFlagged).getTime() - new Date(a.dateFlagged).getTime()
  )
}

export function getExceptionById(id: string): ExceptionRecord | undefined {
  return exceptions.find((e) => e.id === id)
}

export function getExceptionsForOrder(orderId: string): ExceptionRecord[] {
  return exceptions.filter((e) => e.orderId === orderId)
}

export function getExceptionsForCustomer(
  customerId: string
): ExceptionRecord[] {
  return exceptions.filter((e) => {
    const o = orders.find((x) => x.id === e.orderId)
    return o?.customerId === customerId
  })
}

export function getShipments(filter?: {
  status?: "in_transit" | "delayed" | "all"
}): Shipment[] {
  let list = [...shipments]
  const f = filter?.status ?? "all"
  if (f === "in_transit") {
    list = list.filter(
      (s) =>
        s.status === "In Transit" ||
        s.status === "Dispatched" ||
        s.status === "Out for Delivery"
    )
  } else if (f === "delayed") {
    list = list.filter((s) => s.status === "Delayed")
  }
  return list.sort(
    (a, b) =>
      new Date(b.dispatchDate).getTime() - new Date(a.dispatchDate).getTime()
  )
}

export function getShipmentByOrderId(orderId: string): Shipment | undefined {
  return shipments.find((s) => s.orderId === orderId)
}

function docMatched(d: Document | undefined): boolean {
  if (!d) return false
  return d.validation.overall === "VALIDATED" && d.status !== "Mismatch"
}

export function getReconciliationRecords(): ReconciliationRecord[] {
  const map = new Map<
    string,
    { po?: Document; inv?: Document; del?: Document }
  >()
  for (const d of documents) {
    if (!d.matchedOrderId) continue
    const slot = map.get(d.matchedOrderId) ?? {}
    if (d.type === "purchase_order") slot.po = d
    if (d.type === "invoice") slot.inv = d
    if (d.type === "delivery_record") slot.del = d
    map.set(d.matchedOrderId, slot)
  }
  return orders.map((o) => {
    const slot = map.get(o.id)
    const poMatched = docMatched(slot?.po)
    const invoiceMatched = docMatched(slot?.inv)
    const deliveryMatched = docMatched(slot?.del)
    let status: ReconciliationRecord["status"] = "Pending"
    if (poMatched && invoiceMatched && deliveryMatched) status = "Clean"
    else if (!slot?.po || !slot?.inv || !slot?.del) status = "Pending"
    else status = "Needs Review"
    return {
      orderId: o.id,
      poMatched,
      invoiceMatched,
      deliveryMatched,
      status,
    }
  })
}

export function getOrderTimeline(orderId: string): OrderTimelineStep[] {
  const order = getOrderById(orderId)
  if (!order) return []
  const rec = getReconciliationRecords().find((r) => r.orderId === orderId)
  const placed = new Date(order.placedAt)
  const po = getDocumentsForOrder(orderId).find((d) => d.type === "purchase_order")
  const inv = getDocumentsForOrder(orderId).find((d) => d.type === "invoice")
  const del = getDocumentsForOrder(orderId).find((d) => d.type === "delivery_record")
  const steps: OrderTimelineStep[] = [
    {
      id: "1",
      label: "Order Placed",
      at: placed.toISOString(),
      completed: true,
    },
    {
      id: "2",
      label: "PO Issued",
      at: po ? new Date(po.date + "T12:00:00").toISOString() : placed.toISOString(),
      completed: !!po,
    },
    {
      id: "3",
      label: "Invoice Received",
      at: inv ? new Date(inv.date + "T14:00:00").toISOString() : placed.toISOString(),
      completed: !!inv,
    },
    {
      id: "4",
      label: "Delivered",
      at:
        order.status === "Delivered" || order.status === "Exception"
          ? new Date(placed.getTime() + 86400000 * 3).toISOString()
          : new Date(placed.getTime() + 86400000 * 2).toISOString(),
      completed: order.status === "Delivered" || order.status === "Exception",
    },
    {
      id: "5",
      label: "Reconciled",
      at: new Date(placed.getTime() + 86400000 * 4).toISOString(),
      completed: order.status === "Delivered" && rec?.status === "Clean",
    },
  ]
  return steps
}

export function getRecommendedAction(type: ExceptionType): string {
  const m: Record<ExceptionType, string> = {
    "short-ship": "Request redelivery or credit note from supplier.",
    invoice_mismatch: "Request corrected invoice matching received quantities.",
    overcharge: "Request revised invoice or credit memo for variance.",
    damaged_goods: "File carrier claim and request replacement shipment.",
    duplicate_invoice: "Void duplicate and confirm single payable invoice.",
  }
  return m[type]
}

export function getDashboardMetrics(): DashboardMetrics {
  const ref = new Date()
  const day = todayISO()
  const r = seededRandom(`${day}-dash`)
  const ordersThisMonth = orders.filter((o) =>
    isInMonth(o.placedAt, ref)
  ).length
  const jitter = () => 0.985 + r() * 0.03
  const resolved = exceptions.filter((e) => e.status === "Resolved").length
  const excPct =
    exceptions.length === 0
      ? 0
      : Math.round((100 * resolved) / exceptions.length)

  return {
    ordersThisMonth: Math.max(1, Math.round(ordersThisMonth * jitter())),
    documentsProcessed: Math.round(documents.length * jitter()),
    exceptionsFlagged: Math.round(exceptions.length * jitter()),
    exceptionsResolvedPercent: Math.min(100, Math.round(excPct * jitter())),
    manualReviewHoursSavedLabel: "~6.5 hrs/day avg",
    onTimeDeliveryRate: Math.round(seededFloat(`${day}-ot`, 92.5, 95.2) * 10) / 10,
  }
}

export function getOrdersOverTimeLast30Days(): DashboardTimeSeriesPoint[] {
  const day = todayISO()
  const points: DashboardTimeSeriesPoint[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const dayOrders = orders.filter((o) => parseDay(o.placedAt) === key).length
    const dayExc = exceptions.filter((e) => parseDay(e.dateFlagged) === key)
      .length
    const r = seededRandom(`${day}-${key}-ts`)
    const jitter = 0.9 + r() * 0.2
    points.push({
      date: key,
      orders: Math.max(0, Math.round(dayOrders * jitter)),
      exceptions: Math.max(0, Math.round(dayExc * jitter)),
    })
  }
  return points
}

export function getDocumentVolumeByType(): DocumentVolumeByType[] {
  const counts: Record<DocumentType, number> = {
    invoice: 0,
    purchase_order: 0,
    delivery_record: 0,
  }
  for (const d of documents) {
    counts[d.type]++
  }
  return [
    { type: "invoice", label: "Invoices", count: counts.invoice },
    { type: "purchase_order", label: "POs", count: counts.purchase_order },
    {
      type: "delivery_record",
      label: "Delivery Records",
      count: counts.delivery_record,
    },
  ]
}

export function getExceptionRateTrendLast30(): { date: string; rate: number }[] {
  const day = todayISO()
  const out: { date: string; rate: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const ordCount = orders.filter((o) => parseDay(o.placedAt) === key).length
    const excCount = exceptions.filter((e) => parseDay(e.dateFlagged) === key)
      .length
    const r = seededRandom(`${day}-${key}-er`)
    const base = ordCount === 0 ? 0 : (excCount / ordCount) * 100
    out.push({
      date: key,
      rate: Math.round(Math.min(25, base * (0.85 + r() * 0.3)) * 10) / 10,
    })
  }
  return out
}

export function getTopCustomersByVolume(n: number): TopCustomerVolume[] {
  const map = new Map<string, number>()
  for (const o of orders) {
    map.set(o.customerId, (map.get(o.customerId) ?? 0) + 1)
  }
  const rows = Array.from(map.entries())
    .map(([customerId, orderCount]) => ({
      customerId,
      customerName:
        customers.find((c) => c.id === customerId)?.name ?? customerId,
      orderCount,
    }))
    .sort((a, b) => b.orderCount - a.orderCount)
  return rows.slice(0, n)
}

export function getRecentOrders(limit: number): Order[] {
  return [...orders]
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    )
    .slice(0, limit)
}

export function getOrdersForCustomer(
  customerId: string,
  limit = 20
): Order[] {
  return getOrders()
    .filter((o) => o.customerId === customerId)
    .sort(
      (a, b) =>
        new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime()
    )
    .slice(0, limit)
}

export function getDocumentsForCustomer(customerId: string): Document[] {
  return documents.filter((d) => d.customerId === customerId)
}

export function getCustomerMetrics(customerId: string): {
  avgOrderValue: number
  onTimeRate: number
  exceptionRate: number
  ordersThisMonth: number
  totalSpendApprox: number
} {
  const day = todayISO()
  const list = orders.filter((o) => o.customerId === customerId)
  const ref = new Date()
  const monthOrders = list.filter((o) => isInMonth(o.placedAt, ref))
  const total = list.reduce((s, o) => s + o.totalAmount, 0)
  const avg = list.length === 0 ? 0 : total / list.length
  const exc = exceptions.filter((e) => {
    const o = orders.find((x) => x.id === e.orderId)
    return o?.customerId === customerId
  }).length
  const onTime = seededFloat(`${day}-${customerId}-ont`, 91, 97)
  return {
    avgOrderValue: Math.round(avg * 100) / 100,
    onTimeRate: Math.round(onTime * 10) / 10,
    exceptionRate:
      list.length === 0
        ? 0
        : Math.round((exc / list.length) * 1000) / 10,
    ordersThisMonth: monthOrders.length,
    totalSpendApprox: Math.round(total * 100) / 100,
  }
}

export function getCustomerBilling(customerId: string): {
  outstanding: CustomerBillingInvoice[]
  paid: CustomerBillingInvoice[]
  totalOutstanding: number
} {
  const r = seededRandom(`${todayISO()}-${customerId}-bill`)
  const nOut = 2 + Math.floor(r() * 4)
  const outstanding: CustomerBillingInvoice[] = []
  let total = 0
  for (let i = 0; i < nOut; i++) {
    const amt = Math.round((500 + r() * 8000) * 100) / 100
    total += amt
    const due = new Date()
    due.setDate(due.getDate() + Math.floor(r() * 28))
    outstanding.push({
      id: `INV-OUT-${customerId}-${i}`,
      amount: amt,
      dueDate: due.toISOString().slice(0, 10),
      status: "outstanding",
    })
  }
  const paid: CustomerBillingInvoice[] = []
  for (let i = 0; i < 5; i++) {
    const amt = Math.round((400 + r() * 6000) * 100) / 100
    const paidAt = new Date()
    paidAt.setDate(paidAt.getDate() - Math.floor(r() * 90))
    paid.push({
      id: `INV-PD-${customerId}-${i}`,
      amount: amt,
      dueDate: paidAt.toISOString().slice(0, 10),
      status: "paid",
      paidAt: paidAt.toISOString().slice(0, 10),
    })
  }
  return {
    outstanding,
    paid: paid.sort(
      (a, b) =>
        new Date(b.paidAt ?? b.dueDate).getTime() -
        new Date(a.paidAt ?? a.dueDate).getTime()
    ),
    totalOutstanding: Math.round(total * 100) / 100,
  }
}

export function getReportingAggregates(): {
  ordersByCategory: { name: string; value: number }[]
  carrierPerformance: { carrier: string; onTime: number }[]
  delayReasons: { reason: string; count: number }[]
} {
  const day = todayISO()
  const catMap = new Map<string, number>()
  for (const o of orders) {
    catMap.set(
      o.productCategory,
      (catMap.get(o.productCategory) ?? 0) + 1
    )
  }
  const ordersByCategory = Array.from(catMap.entries()).map(([name, value]) => ({
    name,
    value,
  }))
  const carriers = ["MedEx", "PharmaDirect", "QuickRx"] as const
  const carrierPerformance = carriers.map((c, i) => ({
    carrier: c,
    onTime: Math.round(seededFloat(`${day}-carr-${i}`, 88, 97) * 10) / 10,
  }))
  const delayReasons = [
    { reason: "Weather", count: Math.floor(seededFloat(`${day}-d1`, 8, 22)) },
    { reason: "Carrier capacity", count: Math.floor(seededFloat(`${day}-d2`, 5, 18)) },
    { reason: "Address exception", count: Math.floor(seededFloat(`${day}-d3`, 3, 12)) },
    { reason: "Holiday volume", count: Math.floor(seededFloat(`${day}-d4`, 4, 14)) },
  ]
  return { ordersByCategory, carrierPerformance, delayReasons }
}

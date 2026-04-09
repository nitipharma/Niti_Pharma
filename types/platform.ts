/** Platform demo types — simulated data for illustration only */

export type OrderStatus =
  | "Processing"
  | "In Transit"
  | "Delivered"
  | "Exception"

export type DocumentType = "invoice" | "purchase_order" | "delivery_record"

export type DocumentStatus = "Extracted" | "Validated" | "Mismatch" | "Pending"

export type ExceptionType =
  | "short-ship"
  | "invoice_mismatch"
  | "overcharge"
  | "damaged_goods"
  | "duplicate_invoice"

export type ExceptionStatus = "Open" | "Under Review" | "Resolved" | "Escalated"

export type CustomerType = "pharmacy" | "clinic" | "hospital"

export type AccountStatus = "active" | "on_hold" | "review"

export type ShipmentCarrier = "MedEx" | "PharmaDirect" | "QuickRx"

export type ShipmentStatus =
  | "Dispatched"
  | "In Transit"
  | "Out for Delivery"
  | "Delivered"
  | "Delayed"

export interface OrderLineItem {
  productName: string
  orderedQty: number
  deliveredQty: number
  unitPrice: number
  lineTotal: number
}

export interface Order {
  id: string
  customerId: string
  customerName: string
  placedAt: string
  status: OrderStatus
  productCategory: string
  lineItems: OrderLineItem[]
  totalAmount: number
  reconciliationId: string
}

export interface SimulatedDocLine {
  description: string
  qty: number
  unitPrice: number
  total: number
}

export interface SimulatedDocumentContent {
  vendorName: string
  vendorAddress: string
  docNumber: string
  date: string
  lineItems: SimulatedDocLine[]
  total: number
  poReference: string | null
}

export interface ExtractedFields {
  vendor: string
  doc_number: string
  date: string
  line_items: { description: string; qty: number; unit_price: number; line_total: number }[]
  total: number
  po_reference: string | null
}

export interface LineValidationRow {
  productName: string
  orderedQty: number
  extractedQty: number
  match: boolean
}

export interface ValidationResult {
  overall: "VALIDATED" | "MISMATCH"
  lineComparisons: LineValidationRow[]
  mismatchDetail?: string
  confidence: number
}

export interface Document {
  id: string
  type: DocumentType
  vendorOrCustomer: string
  customerId: string
  date: string
  amount: number
  status: DocumentStatus
  matchedOrderId: string | null
  extractedFields: ExtractedFields
  validation: ValidationResult
  confidence: number
  simulatedContent: SimulatedDocumentContent
}

export interface ExceptionRecord {
  id: string
  type: ExceptionType
  orderId: string
  documentId: string | null
  amountDelta: number
  status: ExceptionStatus
  dateFlagged: string
  notes?: string
}

export interface Customer {
  id: string
  name: string
  type: CustomerType
  region: string
  accountStatus: AccountStatus
  city: string
  state: string
}

export interface ShipmentWaypoint {
  label: string
  at: string
}

export interface Shipment {
  id: string
  orderId: string
  customerId: string
  customerName: string
  dispatchDate: string
  eta: string
  carrier: ShipmentCarrier
  status: ShipmentStatus
  progress: number
  waypoints: ShipmentWaypoint[]
}

export interface ReconciliationRecord {
  orderId: string
  poMatched: boolean
  invoiceMatched: boolean
  deliveryMatched: boolean
  status: "Clean" | "Needs Review" | "Pending"
}

export interface DashboardMetrics {
  ordersThisMonth: number
  documentsProcessed: number
  exceptionsFlagged: number
  exceptionsResolvedPercent: number
  manualReviewHoursSavedLabel: string
  onTimeDeliveryRate: number
}

export interface DashboardTimeSeriesPoint {
  date: string
  orders: number
  exceptions: number
}

export interface DocumentVolumeByType {
  type: DocumentType
  label: string
  count: number
}

export interface TopCustomerVolume {
  customerId: string
  customerName: string
  orderCount: number
}

export interface OrderTimelineStep {
  id: string
  label: string
  at: string
  completed: boolean
}

export interface CustomerBillingInvoice {
  id: string
  amount: number
  dueDate: string
  status: "outstanding" | "paid"
  paidAt?: string
}

import type { Document as PrismaDoc, Order, OrderLineItem } from "@prisma/client"
import type { Document, ExtractedFields, LineValidationRow, ValidationResult } from "@/types/platform"

type ExtractedPayload = {
  vendor: string
  doc_number: string
  date: string
  po_reference: string | null
  line_items: {
    description: string
    quantity: number
    unit_price: number
    line_total: number
  }[]
  subtotal: number
  tax: number | null
  total: number
}

function defaultExtracted(): ExtractedFields {
  return {
    vendor: "—",
    doc_number: "—",
    date: new Date().toISOString().slice(0, 10),
    line_items: [],
    total: 0,
    po_reference: null,
  }
}

function toExtractedFields(data: unknown): ExtractedFields {
  if (!data || typeof data !== "object") return defaultExtracted()
  const e = data as ExtractedPayload
  return {
    vendor: e.vendor ?? "—",
    doc_number: e.doc_number ?? "—",
    date: e.date ?? "—",
    po_reference: e.po_reference ?? null,
    line_items: (e.line_items ?? []).map((li) => ({
      description: li.description,
      qty: li.quantity,
      unit_price: li.unit_price,
      line_total: li.line_total,
    })),
    total: e.total ?? 0,
  }
}

function buildValidation(
  doc: PrismaDoc,
  order: (Order & { lineItems: OrderLineItem[] }) | null
): ValidationResult {
  const ex = doc.extractedData as ExtractedPayload | null
  if (!ex || !order) {
    return {
      overall: "VALIDATED",
      lineComparisons: [],
      confidence: doc.confidence ?? 0,
    }
  }

  const rows: LineValidationRow[] = []
  for (const li of ex.line_items ?? []) {
    const match = order.lineItems.find(
      (o) =>
        o.productName.toLowerCase().includes(li.description.toLowerCase().slice(0, 6)) ||
        li.description.toLowerCase().includes(o.productName.toLowerCase().slice(0, 6))
    )
    if (match) {
      const qtyMatch = li.quantity === match.quantity
      const priceOk =
        match.unitPrice === 0
          ? true
          : Math.abs(li.unit_price - match.unitPrice) / match.unitPrice <= 0.02
      rows.push({
        productName: li.description,
        orderedQty: match.quantity,
        extractedQty: li.quantity,
        match: qtyMatch && priceOk,
      })
    } else {
      rows.push({
        productName: li.description,
        orderedQty: 0,
        extractedQty: li.quantity,
        match: false,
      })
    }
  }

  let overall: ValidationResult["overall"] = "VALIDATED"
  if (doc.status === "mismatch") overall = "MISMATCH"
  else if (rows.some((r) => !r.match)) overall = "MISMATCH"

  return {
    overall,
    lineComparisons: rows,
    mismatchDetail:
      overall === "MISMATCH"
        ? "One or more line items do not match the purchase order"
        : undefined,
    confidence: doc.confidence ?? 97,
  }
}

export function prismaDocumentToUi(
  doc: PrismaDoc,
  order: (Order & { lineItems: OrderLineItem[] }) | null
): Document {
  const extracted = toExtractedFields(doc.extractedData)
  const exRaw = doc.extractedData as ExtractedPayload | null

  const simulatedContent = {
    vendorName: doc.vendorName ?? exRaw?.vendor ?? "Vendor",
    vendorAddress: "—",
    docNumber: exRaw?.doc_number ?? doc.id.slice(0, 8),
    date: exRaw?.date ?? doc.uploadedAt.toISOString().slice(0, 10),
    lineItems: (exRaw?.line_items ?? []).map((li) => ({
      description: li.description,
      qty: li.quantity,
      unitPrice: li.unit_price,
      total: li.line_total,
    })),
    total: exRaw?.total ?? 0,
    poReference: exRaw?.po_reference ?? null,
  }

  const statusMap: Record<string, Document["status"]> = {
    uploaded: "Pending",
    ocr_done: "Extracted",
    extracted: "Pending",
    validated: "Validated",
    mismatch: "Mismatch",
    error: "Pending",
  }

  return {
    id: doc.id,
    type: doc.type as Document["type"],
    vendorOrCustomer: doc.vendorName ?? "—",
    customerId: order?.customerId ?? "",
    date: doc.uploadedAt.toISOString().slice(0, 10),
    amount: exRaw?.total ?? 0,
    status: statusMap[doc.status] ?? "Pending",
    matchedOrderId: doc.linkedOrderId,
    extractedFields: extracted,
    validation: buildValidation(doc, order),
    confidence: doc.confidence ?? 0,
    simulatedContent,
  }
}

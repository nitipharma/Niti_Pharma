/**
 * One-time generator for platform demo JSON seed files.
 * Run: node scripts/generate-platform-data.mjs
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const dataDir = path.join(root, "data")

function rnd(seed) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rng = rnd(42)
const pick = (arr) => arr[Math.floor(rng() * arr.length)]
const pickN = (arr, n) => [...arr].sort(() => rng() - 0.5).slice(0, n)

const REGIONS = ["Northeast", "Southeast", "Midwest", "Southwest", "West", "Pacific"]
const CITIES = [
  "Boston", "Atlanta", "Chicago", "Dallas", "Denver", "Seattle", "Phoenix", "Miami",
  "Detroit", "Portland", "Austin", "Nashville", "Charlotte", "Columbus", "Indianapolis",
]

const PRODUCT_POOL = [
  { name: "ParaFast 500mg Tablets", cat: "Analgesic" },
  { name: "AmoxiCure 250mg Capsules", cat: "Antibiotic" },
  { name: "CardioStat 10mg Tablets", cat: "Cardiovascular" },
  { name: "Metformin ER 500mg", cat: "Endocrine" },
  { name: "OmepraShield 20mg", cat: "Gastrointestinal" },
  { name: "Levothyroxine 75mcg", cat: "Endocrine" },
  { name: "AtorvaCare 20mg", cat: "Cardiovascular" },
  { name: "SalbuVent Inhaler", cat: "Respiratory" },
  { name: "Cetirizine 10mg", cat: "Allergy" },
  { name: "Ibuprofen 400mg", cat: "Analgesic" },
  { name: "AzithroMax 500mg", cat: "Antibiotic" },
  { name: "Insulin Glargine Pen", cat: "Endocrine" },
  { name: "Losartan 50mg", cat: "Cardiovascular" },
  { name: "Pantoprazole 40mg", cat: "Gastrointestinal" },
  { name: "Vitamin D3 60k", cat: "Nutraceutical" },
]

const CUSTOMER_NAMES = [
  "BrightCare Pharmacy", "Harborview Clinic", "Summit Hospital Outpatient",
  "Riverside Pharmacy", "Maple Street Drugs", "Unity Medical Clinic",
  "Prairie Health Pharmacy", "Lakeside Family Clinic", "Metro Hospital Pharmacy",
  "GreenLeaf Pharmacy", "Northgate Clinic", "Sunrise Pharmacy",
  "Valley View Hospital", "Cedar Grove Pharmacy", "Parkside Clinic",
  "Evergreen Pharmacy", "Redwood Medical", "BlueSky Pharmacy",
  "Horizon Clinic", "Pinnacle Pharmacy", "Sterling Health",
  "Oakwood Pharmacy", "Willow Creek Clinic", "Aspen Pharmacy",
  "Granite City Drugs", "Silverline Clinic", "Copperfield Pharmacy",
  "Ironwood Medical", "Elm Street Pharmacy", "Birchwood Clinic",
  "Cypress Pharmacy", "Magnolia Health", "Dogwood Clinic",
  "Sycamore Pharmacy", "Juniper Medical", "Hickory Pharmacy",
  "Walnut Grove Clinic", "Chestnut Pharmacy", "Poplar Street Drugs",
  "Dogwood Pharmacy", "Fairview Clinic",
]

const TYPES = ["pharmacy", "clinic", "hospital"]

const customers = []
for (let i = 0; i < 40; i++) {
  customers.push({
    id: `CUST-${String(i + 1).padStart(4, "0")}`,
    name: CUSTOMER_NAMES[i],
    type: i % 5 === 0 ? "hospital" : i % 3 === 0 ? "clinic" : "pharmacy",
    region: pick(REGIONS),
    accountStatus: rng() < 0.92 ? "active" : rng() < 0.5 ? "on_hold" : "review",
    city: pick(CITIES),
    state: pick(["MA", "GA", "IL", "TX", "CO", "WA", "AZ", "FL", "OH", "OR"]),
  })
}

function statusWeight() {
  const r = rng()
  if (r < 0.42) return "Delivered"
  if (r < 0.67) return "In Transit"
  if (r < 0.9) return "Processing"
  return "Exception"
}

function makeLineItems(orderSeed, mismatch) {
  const n = 1 + Math.floor(rng() * 4)
  const items = pickN(PRODUCT_POOL, n)
  const lines = []
  for (let j = 0; j < items.length; j++) {
    const p = items[j]
    const qty = 5 + Math.floor(rng() * 40)
    const unit = Math.round((5 + rng() * 120) * 100) / 100
    let delivered = qty
    if (mismatch && j === 0) delivered = Math.max(0, qty - 2 - Math.floor(rng() * 5))
    const lineTotal = Math.round(qty * unit * 100) / 100
    lines.push({
      productName: p.name,
      orderedQty: qty,
      deliveredQty: delivered,
      unitPrice: unit,
      lineTotal,
    })
  }
  return { lines, category: items[0].cat }
}

const orders = []
const exceptionOrderIds = new Set()
for (let i = 0; i < 60; i++) {
  exceptionOrderIds.add(`ORD-${String(Math.floor(rng() * 500) + 1).padStart(6, "0")}`)
}

for (let i = 0; i < 500; i++) {
  const id = `ORD-${String(i + 1).padStart(6, "0")}`
  const cust = customers[i % 40]
  let status = statusWeight()
  if (exceptionOrderIds.has(id)) status = "Exception"
  const placed = new Date()
  placed.setDate(placed.getDate() - Math.floor(rng() * 90))
  placed.setHours(9 + Math.floor(rng() * 8), Math.floor(rng() * 60), 0, 0)
  const mismatch = status === "Exception" || rng() < 0.04
  const { lines, category } = makeLineItems(i, mismatch)
  const totalAmount = Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100
  orders.push({
    id,
    customerId: cust.id,
    customerName: cust.name,
    placedAt: placed.toISOString(),
    status,
    productCategory: category,
    lineItems: lines,
    totalAmount,
    reconciliationId: `REC-${id}`,
  })
}

function buildSimulatedContent(order, docType, vendorName) {
  const lineItems = order.lineItems.map((li) => ({
    description: li.productName,
    qty: li.orderedQty,
    unitPrice: li.unitPrice,
    total: li.lineTotal,
  }))
  const total = order.totalAmount
  const prefix =
    docType === "purchase_order" ? "PO" : docType === "invoice" ? "INV" : "DLV"
  return {
    vendorName,
    vendorAddress: `${100 + Math.floor(rng() * 900)} Distribution Way, Memphis, TN`,
    docNumber: `${prefix}-${order.id.replace("ORD-", "")}`,
    date: order.placedAt.slice(0, 10),
    lineItems,
    total,
    poReference:
      docType === "invoice" || docType === "delivery_record"
        ? `PO-${order.id.replace("ORD-", "")}`
        : null,
  }
}

function buildExtracted(sim, mismatch) {
  const line_items = sim.lineItems.map((li) => {
    const qty = mismatch ? li.qty + (rng() < 0.5 ? -1 : 1) : li.qty
    const safeQty = Math.max(0, qty)
    return {
      description: li.description,
      qty: safeQty,
      unit_price: li.unitPrice,
      line_total: Math.round(safeQty * li.unitPrice * 100) / 100,
    }
  })
  const tot = line_items.reduce((s, l) => s + l.line_total, 0)
  return {
    vendor: sim.vendorName,
    doc_number: sim.docNumber,
    date: sim.date,
    line_items,
    total: Math.round(tot * 100) / 100,
    po_reference: sim.poReference,
  }
}

function buildValidation(order, extracted, mismatch) {
  const lineComparisons = order.lineItems.map((li, idx) => {
    const ex = extracted.line_items[idx]
    const extractedQty = ex ? ex.qty : li.orderedQty
    return {
      productName: li.productName,
      orderedQty: li.orderedQty,
      extractedQty,
      match: !mismatch || idx > 0,
    }
  })
  const anyMismatch = lineComparisons.some((c) => !c.match)
  return {
    overall: anyMismatch ? "MISMATCH" : "VALIDATED",
    lineComparisons,
    mismatchDetail: anyMismatch ? "Quantity mismatch on primary line item" : undefined,
    confidence: Math.round((92 + rng() * 7) * 10) / 10,
  }
}

const documents = []
let docCounter = 0
for (const order of orders) {
  const isExc = order.status === "Exception"
  const vendors = ["Niti Wholesale", "MedSupply Partners", "PharmaLink Distributors"]
  const vendorName = pick(vendors)
  const types = [
    { t: "purchase_order", prefix: "PO" },
    { t: "invoice", prefix: "INV" },
    { t: "delivery_record", prefix: "DLV" },
  ]
  for (const { t, prefix } of types) {
    docCounter++
    const mismatch = isExc && t === "invoice" && rng() < 0.7
    const sim = buildSimulatedContent(order, t, vendorName)
    const extracted = buildExtracted(sim, mismatch)
    const validation = buildValidation(order, extracted, mismatch)
    let status = "Validated"
    if (validation.overall === "MISMATCH") status = "Mismatch"
    else if (rng() < 0.03) status = "Pending"
    else if (rng() < 0.06) status = "Extracted"
    else status = "Validated"
    if (status === "Validated" && validation.overall === "MISMATCH") status = "Mismatch"

    const docId = `DOC-${prefix}-${String(docCounter).padStart(6, "0")}`
    documents.push({
      id: docId,
      type: t,
      vendorOrCustomer: order.customerName,
      customerId: order.customerId,
      date: order.placedAt.slice(0, 10),
      amount:
        Math.round(order.totalAmount * (t === "invoice" ? 1 : 0.98 + rng() * 0.04) * 100) / 100,
      status,
      matchedOrderId: order.id,
      extractedFields: extracted,
      validation,
      confidence: validation.confidence,
      simulatedContent: sim,
    })
  }
}

const invoiceByOrder = new Map()
for (const d of documents) {
  if (d.type === "invoice" && d.matchedOrderId) {
    invoiceByOrder.set(d.matchedOrderId, d.id)
  }
}

const exceptionTypes = [
  "short-ship",
  "invoice_mismatch",
  "overcharge",
  "damaged_goods",
  "duplicate_invoice",
]
const exceptionStatuses = ["Open", "Under Review", "Resolved", "Escalated"]

const exceptions = []
for (let e = 0; e < 60; e++) {
  const ord = orders[e * 7 + (e % 11)]
  const type = exceptionTypes[e % exceptionTypes.length]
  const amountDelta =
    type === "overcharge"
      ? Math.round(rng() * 500 * 100) / 100
      : type === "short-ship"
        ? -Math.round(rng() * 200 * 100) / 100
        : Math.round((rng() - 0.5) * 300 * 100) / 100
  const flagged = new Date(ord.placedAt)
  flagged.setDate(flagged.getDate() + Math.floor(rng() * 5))
  exceptions.push({
    id: `EXC-${String(e + 1).padStart(5, "0")}`,
    type,
    orderId: ord.id,
    documentId: invoiceByOrder.get(ord.id) ?? null,
    amountDelta,
    status: pick(exceptionStatuses),
    dateFlagged: flagged.toISOString(),
  })
}

const carriers = ["MedEx", "PharmaDirect", "QuickRx"]

const shipments = []
let shipCounter = 0
for (const order of orders) {
  if (order.status !== "In Transit" && order.status !== "Processing" && rng() > 0.15) continue
  if (shipments.length >= 120) break
  shipCounter++
  const delayed = rng() < 0.08
  const st = delayed ? "Delayed" : pick(["Dispatched", "In Transit", "Out for Delivery", "In Transit"])
  const dispatch = new Date(order.placedAt)
  dispatch.setDate(dispatch.getDate() + 1)
  const eta = new Date(dispatch)
  eta.setDate(eta.getDate() + 2 + Math.floor(rng() * 4))
  const progress =
    st === "Delivered"
      ? 100
      : st === "Delayed"
        ? 45 + Math.floor(rng() * 20)
        : st === "Out for Delivery"
          ? 88
          : st === "In Transit"
            ? 55 + Math.floor(rng() * 25)
            : 25 + Math.floor(rng() * 15)
  shipments.push({
    id: `SHP-${String(shipCounter).padStart(5, "0")}`,
    orderId: order.id,
    customerId: order.customerId,
    customerName: order.customerName,
    dispatchDate: dispatch.toISOString(),
    eta: eta.toISOString(),
    carrier: pick(carriers),
    status: st,
    progress,
    waypoints: [
      { label: "Origin scan — Memphis, TN", at: dispatch.toISOString() },
      { label: "In transit — regional hub", at: new Date(dispatch.getTime() + 86400000).toISOString() },
      { label: "Arrived — destination facility", at: new Date(dispatch.getTime() + 172800000).toISOString() },
      { label: "Out for delivery / delayed checkpoint", at: eta.toISOString() },
    ],
  })
}

fs.mkdirSync(dataDir, { recursive: true })
fs.writeFileSync(path.join(dataDir, "customers.json"), JSON.stringify(customers, null, 0))
fs.writeFileSync(path.join(dataDir, "orders.json"), JSON.stringify(orders, null, 0))
fs.writeFileSync(path.join(dataDir, "documents.json"), JSON.stringify(documents, null, 0))
fs.writeFileSync(path.join(dataDir, "exceptions.json"), JSON.stringify(exceptions, null, 0))
fs.writeFileSync(path.join(dataDir, "shipments.json"), JSON.stringify(shipments, null, 0))

console.log(
  "Wrote:",
  customers.length,
  "customers,",
  orders.length,
  "orders,",
  documents.length,
  "documents,",
  exceptions.length,
  "exceptions,",
  shipments.length,
  "shipments"
)

import { prisma } from "@/lib/prisma"

export type ReconciliationResult = {
  orderId: string
  poMatch: boolean
  invoiceMatch: boolean
  deliveryMatch: boolean
  status: "clean" | "needs_review" | "pending"
}

function hasValidated(
  docs: { type: string; status: string }[],
  t: string
): boolean {
  return docs.some((d) => d.type === t && d.status === "validated")
}

export async function reconcileOrder(orderId: string): Promise<ReconciliationResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      documents: { select: { type: true, status: true } },
    },
  })

  if (!order) {
    throw new Error("Order not found")
  }

  const docs = order.documents
  const poMatch = hasValidated(docs, "purchase_order")
  const invoiceMatch = hasValidated(docs, "invoice")
  const deliveryMatch = hasValidated(docs, "delivery_record")

  let status: ReconciliationResult["status"] = "pending"
  if (docs.length === 0) {
    status = "pending"
  } else if (poMatch && invoiceMatch && deliveryMatch) {
    status = "clean"
  } else {
    status = "needs_review"
  }

  await prisma.reconciliationRecord.upsert({
    where: { orderId },
    create: {
      orderId,
      poMatch,
      invoiceMatch,
      deliveryMatch,
      status,
    },
    update: {
      poMatch,
      invoiceMatch,
      deliveryMatch,
      status,
    },
  })

  return {
    orderId,
    poMatch,
    invoiceMatch,
    deliveryMatch,
    status,
  }
}

export async function reconcileAll(): Promise<{
  processed: number
  clean: number
  needs_review: number
}> {
  const orders = await prisma.order.findMany({
    select: { id: true },
    take: 500,
  })
  let processed = 0
  let clean = 0
  let needs_review = 0
  for (const o of orders) {
    const r = await reconcileOrder(o.id)
    processed++
    if (r.status === "clean") clean++
    else if (r.status === "needs_review") needs_review++
  }
  return { processed, clean, needs_review }
}

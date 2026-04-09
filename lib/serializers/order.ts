import type { Customer, Order, OrderLineItem } from "@prisma/client"

export type SerializedOrder = {
  id: string
  customerId: string
  customerName: string
  placedAt: string
  status: string
  productCategory: string
  lineItems: {
    productName: string
    orderedQty: number
    deliveredQty: number
    unitPrice: number
    lineTotal: number
    productSku: string
  }[]
  totalAmount: number
  deliveryAddress: string
  requiredDate: string
  priority: string
  notes: string | null
  createdAt: string
}

export function serializeOrder(
  o: Order & { customer: Customer; lineItems: OrderLineItem[] }
): SerializedOrder {
  const first = o.lineItems[0]
  return {
    id: o.id,
    customerId: o.customerId,
    customerName: o.customer.name,
    placedAt: o.createdAt.toISOString(),
    status: o.status,
    productCategory: first?.productName ?? "—",
    lineItems: o.lineItems.map((li) => ({
      productName: li.productName,
      orderedQty: li.quantity,
      deliveredQty: li.quantity,
      unitPrice: li.unitPrice,
      lineTotal: li.lineTotal,
      productSku: li.productSku,
    })),
    totalAmount: o.totalAmount,
    deliveryAddress: o.deliveryAddress,
    requiredDate: o.requiredDate.toISOString(),
    priority: o.priority,
    notes: o.notes,
    createdAt: o.createdAt.toISOString(),
  }
}

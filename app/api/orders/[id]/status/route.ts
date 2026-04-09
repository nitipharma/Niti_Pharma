import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { serializeOrder } from "@/lib/serializers/order"
import { serializeShipment } from "@/lib/serializers/shipment"

export const runtime = "nodejs"

const bodySchema = z.object({
  status: z.enum([
    "processing",
    "dispatched",
    "in_transit",
    "out_for_delivery",
    "delivered",
    "delayed",
    "exception",
  ]),
})

const CARRIERS = ["MedEx", "PharmaDirect", "QuickRx"] as const

function pickCarrier(orderId: string): string {
  const digits = orderId.replace(/\D/g, "") || "0"
  const n = parseInt(digits.slice(-9), 10) || 0
  return CARRIERS[n % 3]
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(auth.profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const orderId = decodeURIComponent(id)
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }
    const nextStatus = parsed.data.status

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shipments: true },
    })
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const o = await tx.order.update({
        where: { id: orderId },
        data: { status: nextStatus },
        include: { shipments: true, customer: true, lineItems: true },
      })

      if (nextStatus === "dispatched") {
        const existing = await tx.shipment.findUnique({ where: { orderId } })
        if (!existing) {
          await tx.shipment.create({
            data: {
              orderId,
              carrier: pickCarrier(orderId),
              status: "dispatched",
              dispatchedAt: new Date(),
              estimatedDelivery: o.requiredDate,
              waypoints: [],
            },
          })
        }
      }

      if (nextStatus === "delivered") {
        const ship = await tx.shipment.findUnique({ where: { orderId } })
        if (ship) {
          await tx.shipment.update({
            where: { orderId },
            data: {
              status: "delivered",
              deliveredAt: new Date(),
            },
          })
        }
        const inv = await tx.invoice.findFirst({ where: { orderId } })
        if (!inv) {
          await tx.invoice.create({
            data: {
              orderId,
              customerId: o.customerId,
              amount: o.totalAmount,
              dueDate: addDays(new Date(), 30),
              status: "outstanding",
            },
          })
        }
      }

      if (nextStatus === "delayed") {
        const ship = await tx.shipment.findUnique({ where: { orderId } })
        if (ship) {
          const wp = Array.isArray(ship.waypoints)
            ? [...(ship.waypoints as object[])]
            : []
          wp.push({
            timestamp: new Date().toISOString(),
            location: "In transit",
            note: "Shipment delayed",
            status: "delayed",
          })
          await tx.shipment.update({
            where: { orderId },
            data: {
              status: "delayed",
              waypoints: wp,
            },
          })
        }
      }

      if (nextStatus === "in_transit" || nextStatus === "out_for_delivery") {
        const sh = await tx.shipment.findUnique({ where: { orderId } })
        if (sh) {
          await tx.shipment.update({
            where: { orderId },
            data: { status: nextStatus },
          })
        }
      }

      return tx.order.findUnique({
        where: { id: orderId },
        include: { shipments: true, customer: true, lineItems: true },
      })
    })

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { shipments, ...orderRow } = updated
    let shipmentPayload: ReturnType<typeof serializeShipment> | null = null
    if (shipments[0]) {
      const fullShip = await prisma.shipment.findUnique({
        where: { id: shipments[0].id },
        include: { order: { include: { customer: true } } },
      })
      if (fullShip) shipmentPayload = serializeShipment(fullShip)
    }

    return NextResponse.json({
      order: serializeOrder(orderRow),
      shipment: shipmentPayload,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not update status" },
      { status: 500 }
    )
  }
}

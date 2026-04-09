import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { serializeOrder } from "@/lib/serializers/order"

export const runtime = "nodejs"

const patchSchema = z.object({
  notes: z.string().optional(),
  requiredDate: z.string().optional(),
  priority: z.enum(["standard", "urgent", "scheduled"]).optional(),
})

function canViewOrder(
  customerId: string | null,
  orderCustomerId: string,
  admin: boolean
): boolean {
  if (admin) return true
  return customerId != null && customerId === orderCustomerId
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth
    const { id } = await params
    const orderId = decodeURIComponent(id)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        lineItems: true,
        shipments: true,
        documents: {
          select: { id: true, type: true, status: true, uploadedAt: true },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!canViewOrder(profile.customerId, order.customerId, isAdmin(profile))) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const { documents, shipments, ...orderRow } = order
    return NextResponse.json({
      ...serializeOrder(orderRow),
      documents,
      shipments,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load order" },
      { status: 500 }
    )
  }
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
    const { profile } = auth
    const { id } = await params
    const orderId = decodeURIComponent(id)

    const existing = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true, lineItems: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!canViewOrder(profile.customerId, existing.customerId, isAdmin(profile))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (existing.status !== "processing") {
      return NextResponse.json(
        { error: "Order can only be edited while processing" },
        { status: 400 }
      )
    }

    const json = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const data: {
      notes?: string | null
      requiredDate?: Date
      priority?: string
    } = {}
    if (parsed.data.notes !== undefined) data.notes = parsed.data.notes
    if (parsed.data.priority !== undefined) data.priority = parsed.data.priority
    if (parsed.data.requiredDate !== undefined) {
      const d = new Date(parsed.data.requiredDate)
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid date" }, { status: 400 })
      }
      data.requiredDate = d
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data,
      include: { customer: true, lineItems: true },
    })

    return NextResponse.json(serializeOrder(updated))
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not update order" },
      { status: 500 }
    )
  }
}

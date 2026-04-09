import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { serializeOrder } from "@/lib/serializers/order"

export const runtime = "nodejs"

const postBodySchema = z.object({
  customerId: z.string().min(1),
  deliveryAddress: z.string().min(1),
  requiredDate: z.string().min(1),
  priority: z.enum(["standard", "urgent", "scheduled"]),
  notes: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        productSku: z.string().min(1),
        productName: z.string().min(1),
        quantity: z.number().int().min(1),
        unitPrice: z.number().nonnegative(),
      })
    )
    .min(1),
})

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")?.trim() ?? ""
    const status = searchParams.get("status") ?? "all"
    const dateRange = searchParams.get("dateRange") ?? "all"
    const sort = searchParams.get("sort") ?? "date"
    const sortDir = searchParams.get("sortDir") === "asc" ? "asc" : "desc"

    const where: Prisma.OrderWhereInput = {}

    if (!isAdmin(profile)) {
      if (!profile.customerId) {
        return NextResponse.json([])
      }
      where.customerId = profile.customerId
    }

    if (search) {
      where.OR = [
        { id: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ]
    }

    if (status && status !== "all") {
      where.status = status
    }

    if (dateRange === "7") {
      where.createdAt = { gte: daysAgo(7) }
    } else if (dateRange === "30") {
      where.createdAt = { gte: daysAgo(30) }
    } else if (dateRange === "90") {
      where.createdAt = { gte: daysAgo(90) }
    }

    let orderBy: Prisma.OrderOrderByWithRelationInput = {
      createdAt: sortDir,
    }
    if (sort === "amount") {
      orderBy = { totalAmount: sortDir }
    } else if (sort === "status") {
      orderBy = { status: sortDir }
    }

    const rows = await prisma.order.findMany({
      where,
      include: { customer: true, lineItems: true },
      orderBy,
    })

    return NextResponse.json(rows.map(serializeOrder))
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load orders" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, profile } = auth

    const json = await req.json()
    const parsed = postBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      )
    }
    const body = parsed.data

    if (!isAdmin(profile)) {
      if (!profile.customerId || body.customerId !== profile.customerId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const orderId = `ORD-${Date.now()}`
    const totalAmount =
      Math.round(
        body.lineItems.reduce(
          (s, li) => s + li.quantity * li.unitPrice,
          0
        ) * 100
      ) / 100

    const requiredDate = new Date(body.requiredDate)
    if (Number.isNaN(requiredDate.getTime())) {
      return NextResponse.json({ error: "Invalid required date" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          customerId: body.customerId,
          status: "processing",
          deliveryAddress: body.deliveryAddress,
          requiredDate,
          priority: body.priority,
          notes: body.notes ?? null,
          totalAmount,
          lineItems: {
            create: body.lineItems.map((li) => ({
              productSku: li.productSku,
              productName: li.productName,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              lineTotal:
                Math.round(li.quantity * li.unitPrice * 100) / 100,
            })),
          },
        },
      })
    })

    return NextResponse.json({
      orderId,
      status: "processing",
      totalAmount,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not create order" },
      { status: 500 }
    )
  }
}

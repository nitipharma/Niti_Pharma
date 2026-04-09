import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get("customerId")?.trim()
    const status = searchParams.get("status")?.trim()
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    const where: Prisma.InvoiceWhereInput = {}

    if (!isAdmin(profile)) {
      if (!profile.customerId) {
        return NextResponse.json([])
      }
      where.customerId = profile.customerId
    } else if (customerId) {
      where.customerId = customerId
    }

    if (status && status !== "all") {
      where.status = status
    }

    const createdAt: Prisma.DateTimeFilter = {}
    if (dateFrom) {
      const d = new Date(dateFrom)
      if (!Number.isNaN(d.getTime())) {
        createdAt.gte = startOfDay(d)
      }
    }
    if (dateTo) {
      const d = new Date(dateTo)
      if (!Number.isNaN(d.getTime())) {
        createdAt.lte = d
      }
    }
    if (Object.keys(createdAt).length > 0) {
      where.createdAt = createdAt
    }

    const rows = await prisma.invoice.findMany({
      where,
      include: {
        order: { select: { id: true, status: true, totalAmount: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    })

    return NextResponse.json(rows)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load invoices" },
      { status: 500 }
    )
  }
}

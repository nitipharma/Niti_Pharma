import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { serializeShipment } from "@/lib/serializers/shipment"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth
    const { searchParams } = new URL(req.url)
    const filter = searchParams.get("filter") as
      | "in_transit"
      | "delayed"
      | "all"
      | null

    const where: Prisma.ShipmentWhereInput = {
      status: { not: "delivered" },
    }

    if (!isAdmin(profile)) {
      if (!profile.customerId) {
        return NextResponse.json([])
      }
      where.order = { customerId: profile.customerId }
    }

    if (filter === "delayed") {
      where.status = "delayed"
    } else if (filter === "in_transit") {
      where.status = { in: ["in_transit", "out_for_delivery", "dispatched"] }
    }

    const rows = await prisma.shipment.findMany({
      where,
      include: { order: { include: { customer: true } } },
      orderBy: { dispatchedAt: "desc" },
      take: 200,
    })

    return NextResponse.json(rows.map(serializeShipment))
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load shipments" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { serializeShipment } from "@/lib/serializers/shipment"

export const runtime = "nodejs"

const bodySchema = z.object({
  location: z.string().min(1),
  note: z.string().min(1),
  status: z.string().min(1),
})

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
    const shipmentId = decodeURIComponent(id)
    const parsed = bodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const existing = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { order: { include: { customer: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const prev = Array.isArray(existing.waypoints)
      ? [...(existing.waypoints as object[])]
      : []
    prev.push({
      timestamp: new Date().toISOString(),
      location: parsed.data.location,
      note: parsed.data.note,
      status: parsed.data.status,
    })

    const updated = await prisma.shipment.update({
      where: { id: shipmentId },
      data: { waypoints: prev },
      include: { order: { include: { customer: true } } },
    })

    return NextResponse.json({ shipment: serializeShipment(updated) })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not add waypoint" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

const patchSchema = z.object({
  status: z.enum(["resolved", "escalated", "under_review", "open"]).optional(),
  resolutionNotes: z.string().optional(),
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
    const { user, profile } = auth
    const { id } = await params
    const excId = decodeURIComponent(id)

    const existing = await prisma.exception.findUnique({
      where: { id: excId },
      include: { order: true },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const admin = isAdmin(profile)
    const ownsOrder =
      profile.customerId != null &&
      existing.order.customerId === profile.customerId

    if (!admin && !ownsOrder) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const json = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    if (!admin && parsed.data.status !== undefined) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data: {
      status?: string
      resolutionNotes?: string | null
      resolvedAt?: Date | null
      resolvedBy?: string | null
    } = {}

    if (parsed.data.resolutionNotes !== undefined) {
      data.resolutionNotes = parsed.data.resolutionNotes
    }

    if (parsed.data.status !== undefined) {
      data.status = parsed.data.status
      if (parsed.data.status === "resolved") {
        data.resolvedAt = new Date()
        data.resolvedBy = user.id
      }
    }

    const updated = await prisma.exception.update({
      where: { id: excId },
      data,
    })

    return NextResponse.json({ id: updated.id, status: updated.status })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not update exception" },
      { status: 500 }
    )
  }
}

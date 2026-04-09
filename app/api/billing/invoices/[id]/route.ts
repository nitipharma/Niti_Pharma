import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

const patchSchema = z.object({
  status: z.enum(["outstanding", "paid", "overdue", "disputed"]),
})

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
    const invId = decodeURIComponent(id)

    const inv = await prisma.invoice.findUnique({
      where: { id: invId },
      include: {
        order: { include: { lineItems: true, customer: true } },
        customer: true,
        document: true,
      },
    })
    if (!inv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (!isAdmin(profile) && inv.customerId !== profile.customerId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(inv)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load invoice" },
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
    if (!isAdmin(auth.profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const invId = decodeURIComponent(id)
    const parsed = patchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const data: Prisma.InvoiceUpdateInput = {
      status: parsed.data.status,
      paidAt: parsed.data.status === "paid" ? new Date() : null,
    }

    const updated = await prisma.invoice.update({
      where: { id: invId },
      data,
      include: { order: true, customer: true },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not update invoice" },
      { status: 500 }
    )
  }
}

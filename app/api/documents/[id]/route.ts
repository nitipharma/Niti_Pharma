import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { canAccessDocumentWithCustomer } from "@/lib/document-access"
import { prismaDocumentToUi } from "@/lib/serializers/document-ui"
import { runValidationOnly } from "@/lib/document-pipeline"

export const runtime = "nodejs"

const patchSchema = z.object({
  linkedOrderId: z.union([z.string().min(1), z.null()]).optional(),
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
    const { user, profile } = auth
    const { id } = await params
    const docId = decodeURIComponent(id)

    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: {
        order: { include: { lineItems: true } },
      },
    })
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (
      !canAccessDocumentWithCustomer(doc, user.id, profile, isAdmin(profile))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const order = doc.order
    const ui = prismaDocumentToUi(doc, order)
    return NextResponse.json(ui)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load document" },
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
    const { user, profile } = auth
    const { id } = await params
    const docId = decodeURIComponent(id)

    const existing = await prisma.document.findUnique({
      where: { id: docId },
      include: { order: { include: { lineItems: true } } },
    })
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (
      !canAccessDocumentWithCustomer(
        existing,
        user.id,
        profile,
        isAdmin(profile)
      )
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const json = await req.json()
    const parsed = patchSchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const linkedOrderId =
      parsed.data.linkedOrderId === undefined
        ? undefined
        : parsed.data.linkedOrderId

    const updated = await prisma.document.update({
      where: { id: docId },
      data: {
        ...(linkedOrderId !== undefined ? { linkedOrderId } : {}),
      },
      include: { order: { include: { lineItems: true } } },
    })

    if (linkedOrderId !== undefined && updated.linkedOrderId) {
      await runValidationOnly(updated.id)
    }

    const fresh = await prisma.document.findUnique({
      where: { id: docId },
      include: { order: { include: { lineItems: true } } },
    })
    if (!fresh) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(prismaDocumentToUi(fresh, fresh.order))
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not update document" },
      { status: 500 }
    )
  }
}

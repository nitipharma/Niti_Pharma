import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { canAccessDocumentWithCustomer } from "@/lib/document-access"
import { getGetUrl } from "@/lib/r2"

export const runtime = "nodejs"

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
    const docId = decodeURIComponent(id)

    const doc = await prisma.document.findUnique({
      where: { id: docId },
      include: { order: true },
    })
    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (
      !canAccessDocumentWithCustomer(doc, auth.user.id, profile, isAdmin(profile))
    ) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const url = await getGetUrl(doc.r2Key, 3600)
    return NextResponse.redirect(url)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Could not open file" }, { status: 500 })
  }
}

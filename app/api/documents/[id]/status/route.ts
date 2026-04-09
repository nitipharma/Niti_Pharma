import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import { canAccessDocumentWithCustomer } from "@/lib/document-access"

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

    const s = doc.status
    const ocr_done = s !== "uploaded"
    const extracted = ["extracted", "validated", "mismatch"].includes(s)
    const validated =
      s === "validated" || s === "mismatch"

    let result: "validated" | "mismatch" | "pending" | "error" = "pending"
    if (s === "validated") result = "validated"
    else if (s === "mismatch") result = "mismatch"
    else if (s === "error") result = "error"
    else if (extracted && !validated) result = "pending"

    return NextResponse.json({
      id: doc.id,
      status: doc.status,
      type: doc.type,
      vendorName: doc.vendorName,
      linkedOrderId: doc.linkedOrderId,
      uploaded: true,
      ocr_done,
      extracted,
      validated: ["validated", "mismatch"].includes(s),
      result,
      extractedData: doc.extractedData,
      confidence: doc.confidence,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load status" },
      { status: 500 }
    )
  }
}

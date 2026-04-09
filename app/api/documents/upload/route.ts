import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthProfile } from "@/lib/auth-context"
import { uploadBufferToR2 } from "@/lib/r2"
import { enqueueDocumentProcessing } from "@/lib/document-pipeline"

export const runtime = "nodejs"

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
])

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user } = auth

    const formData = await req.formData()
    const file = formData.get("file")
    const type = String(formData.get("type") ?? "")
    const linkedOrderId = formData.get("linkedOrderId")
    const vendorName = String(formData.get("vendorName") ?? "")

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 })
    }
    if (!["invoice", "purchase_order", "delivery_record"].includes(type)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 })
    }

    const ct = file.type || "application/octet-stream"
    if (!ALLOWED.has(ct) && !ct.startsWith("image/")) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const key = `${user.id}/documents/${Date.now()}-${safeName}`

    await uploadBufferToR2(key, buffer, ct)

    const doc = await prisma.document.create({
      data: {
        userId: user.id,
        r2Key: key,
        type,
        vendorName: vendorName || null,
        linkedOrderId:
          typeof linkedOrderId === "string" && linkedOrderId.length > 0
            ? linkedOrderId
            : null,
        status: "uploaded",
      },
    })

    enqueueDocumentProcessing(doc.id)

    return NextResponse.json({ documentId: doc.id, status: "uploaded" })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
}

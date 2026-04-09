import { NextResponse } from "next/server"
import { getDocumentById } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = getDocumentById(decodeURIComponent(id))
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(doc)
}

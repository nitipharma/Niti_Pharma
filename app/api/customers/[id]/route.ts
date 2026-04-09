import { NextResponse } from "next/server"
import { getCustomerById } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const c = getCustomerById(decodeURIComponent(id))
  if (!c) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(c)
}

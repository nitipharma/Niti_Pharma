import { NextRequest, NextResponse } from "next/server"
import { getShipments } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") as
    | "in_transit"
    | "delayed"
    | "all"
    | null
  return NextResponse.json(
    getShipments({
      status: filter ?? "all",
    })
  )
}

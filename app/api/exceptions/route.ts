import { NextRequest, NextResponse } from "next/server"
import { getExceptions, type ExceptionListFilters } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filters: ExceptionListFilters = {
    type: (searchParams.get("type") as ExceptionListFilters["type"]) ?? "all",
    status: (searchParams.get("status") as ExceptionListFilters["status"]) ?? "all",
    dateRange: (searchParams.get("dateRange") as ExceptionListFilters["dateRange"]) ?? "all",
  }
  return NextResponse.json(getExceptions(filters))
}

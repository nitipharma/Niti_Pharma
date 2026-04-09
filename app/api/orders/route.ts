import { NextRequest, NextResponse } from "next/server"
import { getOrders, type OrderListFilters } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filters: OrderListFilters = {
    search: searchParams.get("search") ?? undefined,
    status: (searchParams.get("status") as OrderListFilters["status"]) ?? "all",
    dateRange: (searchParams.get("dateRange") as OrderListFilters["dateRange"]) ?? "all",
    sort: (searchParams.get("sort") as OrderListFilters["sort"]) ?? "date",
    sortDir: (searchParams.get("sortDir") as OrderListFilters["sortDir"]) ?? "desc",
  }
  if (filters.status && !["all", "Processing", "In Transit", "Delivered", "Exception"].includes(filters.status)) {
    filters.status = "all"
  }
  return NextResponse.json(getOrders(filters))
}

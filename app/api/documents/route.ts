import { NextRequest, NextResponse } from "next/server"
import { getDocuments, type DocumentListFilters } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filters: DocumentListFilters = {
    type: (searchParams.get("type") as DocumentListFilters["type"]) ?? "all",
    status: (searchParams.get("status") as DocumentListFilters["status"]) ?? "all",
    search: searchParams.get("search") ?? undefined,
  }
  return NextResponse.json(getDocuments(filters))
}

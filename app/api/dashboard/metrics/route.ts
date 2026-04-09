import { NextResponse } from "next/server"
import { getDashboardMetrics } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(getDashboardMetrics())
}

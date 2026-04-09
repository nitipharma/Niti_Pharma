import { NextResponse } from "next/server"
import { getReconciliationRecords } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(getReconciliationRecords())
}

import { NextResponse } from "next/server"
import { getCustomers } from "@/lib/demo-data"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(getCustomers())
}

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

export async function GET() {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth

    if (isAdmin(profile)) {
      const rows = await prisma.customer.findMany({
        orderBy: { name: "asc" },
        take: 500,
      })
      return NextResponse.json(rows)
    }

    if (!profile.customerId) {
      return NextResponse.json([])
    }

    const row = await prisma.customer.findUnique({
      where: { id: profile.customerId },
    })
    return NextResponse.json(row ? [row] : [])
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load customers" },
      { status: 500 }
    )
  }
}

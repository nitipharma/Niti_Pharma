import { NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import type { ReconciliationRecord } from "@/types/platform"

export const runtime = "nodejs"

export async function GET() {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth

    let where: Prisma.ReconciliationRecordWhereInput = {}
    if (!isAdmin(profile)) {
      if (!profile.customerId) {
        return NextResponse.json({
          records: [],
          aggregate: {
            clean: 0,
            needs_review: 0,
            pending: 0,
            total: 0,
          },
        })
      }
      where = { order: { customerId: profile.customerId } }
    }

    const rows = await prisma.reconciliationRecord.findMany({
      where,
      include: { order: { include: { customer: true } } },
      orderBy: { updatedAt: "desc" },
      take: 500,
    })

    const list: ReconciliationRecord[] = rows.map((r) => ({
      orderId: r.orderId,
      poMatched: r.poMatch,
      invoiceMatched: r.invoiceMatch,
      deliveryMatched: r.deliveryMatch,
      status:
        r.status === "clean"
          ? "Clean"
          : r.status === "needs_review"
            ? "Needs Review"
            : "Pending",
    }))

    const agg = {
      clean: list.filter((x) => x.status === "Clean").length,
      needs_review: list.filter((x) => x.status === "Needs Review").length,
      pending: list.filter((x) => x.status === "Pending").length,
      total: list.length,
    }

    return NextResponse.json({ records: list, aggregate: agg })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load reconciliation" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"
import type { ExceptionRecord, ExceptionStatus, ExceptionType } from "@/types/platform"

export const runtime = "nodejs"

function typeUiToDb(t: string): string {
  const m: Record<string, string> = {
    "short-ship": "short_ship",
    invoice_mismatch: "invoice_mismatch",
    overcharge: "overcharge",
    damaged_goods: "damaged_goods",
    duplicate_invoice: "duplicate_invoice",
  }
  return m[t] ?? t
}

function typeDbToUi(t: string): ExceptionType {
  const m: Record<string, ExceptionType> = {
    short_ship: "short-ship",
    invoice_mismatch: "invoice_mismatch",
    overcharge: "overcharge",
    damaged_goods: "damaged_goods",
    duplicate_invoice: "duplicate_invoice",
  }
  return m[t] ?? "short-ship"
}

function statusUiToDb(s: string): string {
  const m: Record<string, string> = {
    Open: "open",
    "Under Review": "under_review",
    Resolved: "resolved",
    Escalated: "escalated",
  }
  return m[s] ?? s.toLowerCase().replace(/\s+/g, "_")
}

function statusDbToUi(s: string): ExceptionStatus {
  const m: Record<string, ExceptionStatus> = {
    open: "Open",
    under_review: "Under Review",
    resolved: "Resolved",
    escalated: "Escalated",
  }
  return m[s] ?? "Open"
}

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(0, 0, 0, 0)
  return d
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { profile } = auth
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") ?? "all"
    const status = searchParams.get("status") ?? "all"
    const dateRange = searchParams.get("dateRange") ?? "all"
    const orderId = searchParams.get("orderId")?.trim()

    const where: Prisma.ExceptionWhereInput = {}

    if (!isAdmin(profile)) {
      if (!profile.customerId) {
        return NextResponse.json([])
      }
      where.order = { customerId: profile.customerId }
    }

    if (type && type !== "all") {
      where.type = typeUiToDb(type)
    }
    if (status && status !== "all") {
      where.status = statusUiToDb(status)
    }
    if (dateRange === "7") {
      where.dateFlagged = { gte: daysAgo(7) }
    } else if (dateRange === "30") {
      where.dateFlagged = { gte: daysAgo(30) }
    } else if (dateRange === "90") {
      where.dateFlagged = { gte: daysAgo(90) }
    }
    if (orderId) {
      where.orderId = { contains: orderId, mode: "insensitive" }
    }

    const rows = await prisma.exception.findMany({
      where,
      include: {
        order: { include: { customer: true } },
        document: { select: { id: true, type: true, status: true } },
      },
      orderBy: { dateFlagged: "desc" },
      take: 300,
    })

    const out: ExceptionRecord[] = rows.map((r) => ({
      id: r.id,
      type: typeDbToUi(r.type),
      orderId: r.orderId,
      documentId: r.documentId,
      amountDelta: r.amountDelta,
      status: statusDbToUi(r.status),
      dateFlagged: r.dateFlagged.toISOString(),
      notes: r.resolutionNotes ?? undefined,
    }))

    return NextResponse.json(out)
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load exceptions" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const { user, profile } = auth

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") ?? "all"
    const status = searchParams.get("status") ?? "all"
    const search = searchParams.get("search")?.trim() ?? ""

    const andFilters: Prisma.DocumentWhereInput[] = []

    if (!isAdmin(profile)) {
      andFilters.push({
        OR: [
          { userId: user.id },
          ...(profile.customerId
            ? [{ order: { customerId: profile.customerId } }]
            : []),
        ],
      })
    }

    if (type && type !== "all") {
      andFilters.push({ type })
    }
    if (status && status !== "all") {
      andFilters.push({ status: mapUiStatusToDb(status) })
    }
    if (search) {
      andFilters.push({
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { vendorName: { contains: search, mode: "insensitive" } },
          { linkedOrderId: { contains: search, mode: "insensitive" } },
        ],
      })
    }

    const where: Prisma.DocumentWhereInput =
      andFilters.length > 0 ? { AND: andFilters } : {}

    const rows = await prisma.document.findMany({
      where,
      include: {
        order: { include: { customer: true } },
      },
      orderBy: { uploadedAt: "desc" },
      take: 200,
    })

    return NextResponse.json(
      rows.map((d) => ({
        id: d.id,
        type: d.type,
        vendorOrCustomer: d.order?.customer?.name ?? d.vendorName ?? "—",
        customerId: d.order?.customerId ?? null,
        date: d.uploadedAt.toISOString().slice(0, 10),
        amount: extractTotal(d.extractedData),
        status: mapDbStatusToUi(d.status),
        matchedOrderId: d.linkedOrderId,
        extractedFields: d.extractedData,
        validation: {
          overall:
            d.status === "mismatch"
              ? "MISMATCH"
              : d.status === "validated"
                ? "VALIDATED"
                : "VALIDATED",
          lineComparisons: [],
        },
        confidence: d.confidence ?? 0,
        simulatedContent: buildSimulated(d),
      }))
    )
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not load documents" },
      { status: 500 }
    )
  }
}

function extractTotal(extracted: unknown): number {
  if (
    extracted &&
    typeof extracted === "object" &&
    extracted !== null &&
    "total" in extracted
  ) {
    return Number((extracted as { total: number }).total)
  }
  return 0
}

function mapUiStatusToDb(ui: string): string {
  const m: Record<string, string> = {
    Extracted: "ocr_done",
    Validated: "validated",
    Mismatch: "mismatch",
    Pending: "uploaded",
  }
  return m[ui] ?? ui.toLowerCase()
}

function mapDbStatusToUi(s: string): string {
  if (s === "ocr_done") return "Extracted"
  if (s === "extracted") return "Pending"
  if (s === "validated") return "Validated"
  if (s === "mismatch") return "Mismatch"
  if (s === "uploaded") return "Pending"
  return "Pending"
}

function buildSimulated(d: {
  vendorName: string | null
  extractedData: unknown
  uploadedAt: Date
}) {
  const ex = d.extractedData as Record<string, unknown> | null
  return {
    vendorName: d.vendorName ?? String(ex?.vendor ?? "Vendor"),
    vendorAddress: "—",
    docNumber: String(ex?.doc_number ?? "—"),
    date: String(ex?.date ?? d.uploadedAt.toISOString().slice(0, 10)),
    lineItems: Array.isArray(ex?.line_items)
      ? (ex.line_items as object[])
      : [],
    total: Number(ex?.total ?? 0),
    poReference: ex?.po_reference != null ? String(ex.po_reference) : null,
  }
}

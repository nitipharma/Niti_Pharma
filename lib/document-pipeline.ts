import Anthropic from "@anthropic-ai/sdk"
import { createWorker } from "tesseract.js"
import { prisma } from "@/lib/prisma"
import { getGetUrl } from "@/lib/r2"

type ExtractedPayload = {
  vendor: string
  doc_number: string
  date: string
  po_reference: string | null
  line_items: {
    description: string
    quantity: number
    unit_price: number
    line_total: number
  }[]
  subtotal: number
  tax: number | null
  total: number
}

function stripJsonFence(s: string): string {
  let t = s.trim()
  if (t.startsWith("```")) {
    t = t.replace(/^```[a-zA-Z]*\n?/, "").replace(/```\s*$/, "")
  }
  return t.trim()
}

async function fetchBufferFromR2(r2Key: string): Promise<Buffer> {
  const url = await getGetUrl(r2Key, 120)
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch file from storage")
  const ab = await res.arrayBuffer()
  return Buffer.from(ab)
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("pdf-parse")).default
  const data = await pdfParse(buffer)
  return data.text ?? ""
}

async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng")
  try {
    const {
      data: { text },
    } = await worker.recognize(buffer)
    return text ?? ""
  } finally {
    await worker.terminate()
  }
}

async function runClaude(type: string, rawText: string): Promise<ExtractedPayload> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured")
  const anthropic = new Anthropic({ apiKey })
  const userPrompt = `Extract from this ${type} document:

${rawText.slice(0, 80000)}

Return JSON matching exactly:
{
  "vendor": string,
  "doc_number": string,
  "date": string (YYYY-MM-DD),
  "po_reference": string | null,
  "line_items": Array<{
    "description": string,
    "quantity": number,
    "unit_price": number,
    "line_total": number
  }>,
  "subtotal": number,
  "tax": number | null,
  "total": number
}`

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system:
      "You are a document data extraction API. Extract structured data from the provided document text. Return ONLY valid JSON, no explanation, no markdown.",
    messages: [{ role: "user", content: userPrompt }],
  })

  const block = msg.content[0]
  if (block.type !== "text") throw new Error("Unexpected Claude response")
  const jsonStr = stripJsonFence(block.text)
  return JSON.parse(jsonStr) as ExtractedPayload
}

function wordsOverlap(a: string, b: string): boolean {
  const aw = a.toLowerCase().split(/\W+/).filter(Boolean)
  const bw = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))
  return aw.some((w) => w.length > 2 && bw.has(w))
}

export async function validateAgainstOrder(
  documentId: string,
  orderId: string
): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { lineItems: true },
  })
  if (!doc?.extractedData || !order) return

  const extracted = doc.extractedData as unknown as ExtractedPayload
  const items = extracted.line_items ?? []
  let mismatch = false

  for (const di of items) {
    const matchLine = order.lineItems.find(
      (li) =>
        wordsOverlap(di.description, li.productName) ||
        li.productName
          .toLowerCase()
          .includes(di.description.toLowerCase().slice(0, 8))
    )
    if (!matchLine) {
      mismatch = true
      await prisma.exception.create({
        data: {
          orderId,
          documentId,
          type: "invoice_mismatch",
          description: `No matching order line for: ${di.description}`,
          amountDelta: di.line_total,
          status: "open",
        },
      })
      continue
    }
    const qtyDiff = Math.abs(di.quantity - matchLine.quantity)
    const priceDiff =
      matchLine.unitPrice > 0
        ? Math.abs(di.unit_price - matchLine.unitPrice) / matchLine.unitPrice
        : 0
    if (qtyDiff > 0) {
      mismatch = true
      await prisma.exception.create({
        data: {
          orderId,
          documentId,
          type: "short_ship",
          description: `Ordered ${matchLine.quantity} units of ${matchLine.productName}, document shows ${di.quantity}`,
          amountDelta: di.line_total - matchLine.lineTotal,
          status: "open",
        },
      })
    } else if (priceDiff > 0.02) {
      mismatch = true
      await prisma.exception.create({
        data: {
          orderId,
          documentId,
          type: "overcharge",
          description: `Price variance on ${matchLine.productName}`,
          amountDelta: di.line_total - matchLine.lineTotal,
          status: "open",
        },
      })
    }
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: mismatch ? "mismatch" : "validated" },
  })
}

export async function runValidationOnly(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  if (!doc?.linkedOrderId || !doc.extractedData) return
  await validateAgainstOrder(documentId, doc.linkedOrderId)
}

export async function processDocument(documentId: string): Promise<void> {
  const doc = await prisma.document.findUnique({ where: { id: documentId } })
  if (!doc) return

  try {
    const buffer = await fetchBufferFromR2(doc.r2Key)
    const lower = doc.r2Key.toLowerCase()
    let rawText = ""
    if (lower.endsWith(".pdf")) {
      rawText = await extractTextFromPdf(buffer)
    } else if (
      lower.endsWith(".png") ||
      lower.endsWith(".jpg") ||
      lower.endsWith(".jpeg")
    ) {
      rawText = await extractTextFromImage(buffer)
    } else {
      rawText = await extractTextFromImage(buffer)
    }

    await prisma.document.update({
      where: { id: documentId },
      data: {
        rawText,
        status: "ocr_done",
      },
    })

    const extracted = await runClaude(doc.type, rawText)
    const confidence = 0.97

    await prisma.document.update({
      where: { id: documentId },
      data: {
        extractedData: extracted as object,
        confidence,
        status: "extracted",
      },
    })

    if (!doc.linkedOrderId) {
      return
    }

    await validateAgainstOrder(documentId, doc.linkedOrderId)
  } catch (e) {
    console.error("processDocument", documentId, e)
    await prisma.document.update({
      where: { id: documentId },
      data: { status: "error" },
    })
  }
}

export function enqueueDocumentProcessing(documentId: string): void {
  queueMicrotask(() => {
    void processDocument(documentId)
  })
}

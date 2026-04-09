import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

const COMPANY =
  process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Niti Pharma Distribution"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(auth.profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { id } = await params
    const invId = decodeURIComponent(id)

    const inv = await prisma.invoice.findUnique({
      where: { id: invId },
      include: { customer: true, order: true },
    })
    if (!inv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const email = inv.customer.email
    if (!email) {
      return NextResponse.json(
        { error: "Customer has no email on file" },
        { status: 400 }
      )
    }

    const key = process.env.RESEND_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: "Email not configured" },
        { status: 500 }
      )
    }

    const resend = new Resend(key)
    const due = inv.dueDate.toLocaleDateString()
    const subject = `Payment Reminder — Invoice ${inv.id} for Order ${inv.orderId}`
    const body = `Dear ${inv.customer.name},

This is a reminder that invoice ${inv.id} for order ${inv.orderId} is due on ${due}.

Amount due: $${inv.amount.toFixed(2)}

Please contact us if you have any questions.

${COMPANY} Finance Team`

    await resend.emails.send({
      from: process.env.RESEND_FROM ?? "noreply@example.com",
      to: email,
      subject,
      text: body,
    })

    await prisma.invoice.update({
      where: { id: invId },
      data: { reminderSentAt: new Date() },
    })

    return NextResponse.json({ sent: true, sentTo: email })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Could not send reminder" },
      { status: 500 }
    )
  }
}

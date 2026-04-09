import { NextResponse } from "next/server"
import { Resend } from "resend"
import { prisma } from "@/lib/prisma"
import { getAuthProfile, isAdmin } from "@/lib/auth-context"

export const runtime = "nodejs"

const COMPANY =
  process.env.NEXT_PUBLIC_COMPANY_NAME ?? "Niti Pharma Distribution"

export async function POST() {
  try {
    const auth = await getAuthProfile()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (!isAdmin(auth.profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const key = process.env.RESEND_API_KEY
    if (!key) {
      return NextResponse.json(
        { error: "Email not configured" },
        { status: 500 }
      )
    }

    const now = new Date()
    const overdue = await prisma.invoice.findMany({
      where: {
        status: "outstanding",
        dueDate: { lt: now },
      },
      include: { customer: true },
    })

    const resend = new Resend(key)
    const seen = new Set<string>()
    let sent = 0
    let errors = 0

    for (const inv of overdue) {
      const email = inv.customer.email
      if (!email || seen.has(email)) continue
      seen.add(email)
      try {
        const subject = `Payment Reminder — Invoice ${inv.id} for Order ${inv.orderId}`
        const body = `Dear ${inv.customer.name},

This is a reminder that invoice ${inv.id} for order ${inv.orderId} is due on ${inv.dueDate.toLocaleDateString()}.

Amount due: $${inv.amount.toFixed(2)}

Please contact us if you have any questions.

${COMPANY} Finance Team`

        await resend.emails.send({
          from: process.env.RESEND_FROM ?? "noreply@example.com",
          to: email,
          subject,
          text: body,
        })
        sent++
      } catch {
        errors++
      }
    }

    await prisma.invoice.updateMany({
      where: {
        id: { in: overdue.map((i) => i.id) },
      },
      data: { reminderSentAt: new Date() },
    })

    return NextResponse.json({ sent, errors })
  } catch (e) {
    console.error(e)
    return NextResponse.json(
      { error: "Bulk send failed" },
      { status: 500 }
    )
  }
}

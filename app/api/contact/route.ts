import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "nitipharma04@gmail.com"
const CONTACT_FROM_EMAIL =
  process.env.CONTACT_FROM_EMAIL || "Niti Pharma Contact Form <onboarding@resend.dev>"

// Strip control characters so user input can't shape email headers
const cleanString = (max: number) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " "))

const ContactSchema = z.object({
  name: cleanString(200),
  email: z.string().trim().email().max(320),
  phone: cleanString(30),
  pharmacyName: cleanString(200),
  city: cleanString(100),
  state: cleanString(100),
  gstin: z
    .string()
    .trim()
    .max(20)
    .transform((s) => s.replace(/[\u0000-\u001f\u007f]/g, " "))
    .optional()
    .or(z.literal("")),
  message: z.string().trim().min(1).max(5000),
})

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// Simple in-memory rate limit: max 5 submissions per IP per 10 minutes.
// Per-instance only, but enough to stop casual abuse of the email quota.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX = 5
const rateLimitHits = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const hits = (rateLimitHits.get(ip) || []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  )
  if (rateLimitHits.size > 10000) {
    rateLimitHits.clear() // safety valve against unbounded growth
  }
  if (hits.length >= RATE_LIMIT_MAX) {
    rateLimitHits.set(ip, hits)
    return true
  }
  hits.push(now)
  rateLimitHits.set(ip, hits)
  return false
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    const body = await request.json().catch(() => null)
    const parsed = ContactSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid or missing fields" },
        { status: 400 }
      )
    }
    const { name, email, phone, pharmacyName, city, state, gstin, message } =
      parsed.data

    // Format email content
    const emailContent = `
New Contact Form Submission from Niti Pharma Website

Contact Details:
- Name: ${name}
- Email: ${email}
- Phone: ${phone}
- Pharmacy Name: ${pharmacyName}
- City: ${city}
- State: ${state}
${gstin ? `- GSTIN: ${gstin}` : ""}

Message:
${message}

---
This email was sent from the Niti Pharma contact form.
    `.trim()

    // Send email using Resend SDK
    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured")
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    // Initialize Resend only when needed (at runtime, not build time)
    const resend = new Resend(process.env.RESEND_API_KEY)

    const h = {
      name: escapeHtml(name),
      email: escapeHtml(email),
      phone: escapeHtml(phone),
      pharmacyName: escapeHtml(pharmacyName),
      city: escapeHtml(city),
      state: escapeHtml(state),
      gstin: gstin ? escapeHtml(gstin) : "",
      message: escapeHtml(message),
    }

    const { error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      replyTo: email,
      subject: `New Contact Form Submission from ${name.slice(0, 80)}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0a5c50;">New Contact Form Submission</h2>
          <p>You have received a new contact form submission from the Niti Pharma website.</p>

          <h3 style="color: #333; margin-top: 20px;">Contact Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Pharmacy Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.pharmacyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">City:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.city}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">State:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.state}</td>
            </tr>
            ${h.gstin ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">GSTIN:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${h.gstin}</td>
            </tr>
            ` : ""}
          </table>

          <h3 style="color: #333; margin-top: 20px;">Message:</h3>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${h.message}</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">This email was sent from the Niti Pharma contact form.</p>
        </div>
      `,
    })

    if (error) {
      console.error("Resend API error:", error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "Email sent successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

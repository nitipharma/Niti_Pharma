import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, pharmacyName, city, state, gstin, message } = body

    // Validate required fields
    if (!name || !email || !phone || !pharmacyName || !city || !state || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

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

    const { data, error } = await resend.emails.send({
      from: "Niti Pharma Contact Form <onboarding@resend.dev>",
      to: ["nitipharma04@gmail.com"],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      text: emailContent,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">New Contact Form Submission</h2>
          <p>You have received a new contact form submission from the Niti Pharma website.</p>
          
          <h3 style="color: #333; margin-top: 20px;">Contact Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;"><a href="tel:${phone}">${phone}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Pharmacy Name:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${pharmacyName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">City:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${city}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">State:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${state}</td>
            </tr>
            ${gstin ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">GSTIN:</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${gstin}</td>
            </tr>
            ` : ""}
          </table>
          
          <h3 style="color: #333; margin-top: 20px;">Message:</h3>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</p>
          
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

    return NextResponse.json(
      { message: "Email sent successfully", id: data?.id },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}


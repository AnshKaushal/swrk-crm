import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { sendCustomEmail } from "@/lib/email"

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()

  if (!body.email || !body.subject || !body.body) {
    return NextResponse.json(
      { error: "Email, subject, and body are required" },
      { status: 400 },
    )
  }

  try {
    await sendCustomEmail(
      body.email,
      body.recipientName || "Recipient",
      body.subject,
      body.body,
    )
    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Failed to send email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

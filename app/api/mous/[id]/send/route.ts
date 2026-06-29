import mongoose from "mongoose"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { MOU } from "@/lib/models/MOU"
import { generateMOUPDF } from "@/lib/pdf"
import { sendMOUEmail } from "@/lib/email"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const { id } = await params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const mou = await MOU.findById(id)
  if (!mou) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const dateStr = new Date(mou.date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  let pdfBuffer
  try {
    pdfBuffer = await generateMOUPDF(mou.name, dateStr)
  } catch (error) {
    console.error("Failed to generate PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }

  try {
    await sendMOUEmail(mou.email, mou.name, dateStr, mou._id.toString(), pdfBuffer)
    mou.status = "sent"
    mou.sentAt = new Date()
    await mou.save()
    return NextResponse.json({ success: true, message: "Email sent successfully" })
  } catch (error) {
    console.error("Failed to send MOU email:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

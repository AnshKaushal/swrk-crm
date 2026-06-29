import mongoose from "mongoose"
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { MOU } from "@/lib/models/MOU"
import { generateMOUPDF } from "@/lib/pdf"

export async function GET(
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

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="SWRK-BDE-Agreement-${mou.name.replace(/\s+/g, "-")}.pdf"`,
    },
  })
}

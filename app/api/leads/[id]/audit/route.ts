import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { AuditLog } from "@/lib/models/AuditLog"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await connectDB()

  const logs = await AuditLog.find({ leadId: id })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json(logs)
}

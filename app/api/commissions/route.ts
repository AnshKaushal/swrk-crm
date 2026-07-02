import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Commission } from "@/lib/models/Commission"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  await connectDB()

  let filter: Record<string, any> = {}

  if (session.user.role === "employee") {
    filter.userId = session.user.id
  } else if (session.user.role === "manager") {
    const subordinates = await User.find({ assignedManager: session.user.id }).select("_id").lean()
    const ids = [session.user.id, ...subordinates.map((u) => u._id.toString())]
    if (userId && ids.includes(userId)) {
      filter.userId = userId
    } else {
      filter.userId = { $in: ids }
    }
  } else if (session.user.role === "admin" || session.user.role === "super_admin") {
    if (userId) filter.userId = userId
  }

  const commissions = await Commission.find(filter)
    .populate("userId", "name email role")
    .populate("leadId", "name company value currency")
    .sort({ createdAt: -1 })
    .lean()

  if (session.user.role === "employee") {
    const sanitized = commissions.map((c: any) => ({
      _id: c._id,
      dealName: c.dealName,
      commissionRate: c.commissionRate,
      commissionAmount: c.commissionAmount,
      currency: c.currency,
      status: c.status,
      createdAt: c.createdAt,
      paidDate: c.paidDate,
    }))
    return NextResponse.json(sanitized)
  }

  return NextResponse.json(commissions)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const body = await request.json()
  const { commissionId, status } = body

  if (!commissionId) {
    return NextResponse.json({ error: "commissionId required" }, { status: 400 })
  }

  const commission = await Commission.findById(commissionId)
  if (!commission) {
    return NextResponse.json({ error: "Commission not found" }, { status: 404 })
  }

  if (status === "paid") {
    commission.status = "paid"
    commission.paidDate = new Date()
  } else if (status === "pending") {
    commission.status = "pending"
    commission.paidDate = undefined
  }

  await commission.save()
  return NextResponse.json(commission)
}

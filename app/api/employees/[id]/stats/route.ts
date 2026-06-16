import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Lead } from "@/lib/models/Lead"
import { Payment } from "@/lib/models/Payment"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !["super_admin", "admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await connectDB()

  if (session.user.role === "manager") {
    const employee = await User.findOne({ _id: id, assignedManager: session.user.id })
    if (!employee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const totalLeads = await Lead.countDocuments({ assignedTo: id })
  const wonLeads = await Lead.countDocuments({ assignedTo: id, stage: "closed_won" })

  const byStage = await Lead.aggregate([
    { $match: { assignedTo: id } },
    { $group: { _id: "$stage", count: { $sum: 1 }, totalValue: { $sum: "$value" } } },
  ])

  const pipelineValue = await Lead.aggregate([
    { $match: { assignedTo: id } },
    { $group: { _id: "$currency", total: { $sum: "$value" } } },
  ])

  const leadIds = (await Lead.find({ assignedTo: id }).select("_id").lean()).map((l) => l._id)

  const paymentAgg = await Payment.aggregate([
    { $match: { leadId: { $in: leadIds } } },
    {
      $group: {
        _id: "$currency",
        totalCollected: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] } },
        totalPending: { $sum: { $cond: [{ $ne: ["$status", "paid"] }, "$amount", 0] } },
        paidCount: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] } },
        totalCount: { $sum: 1 },
      },
    },
  ])

  return NextResponse.json({
    totalLeads,
    wonLeads,
    byStage,
    pipelineValue,
    payments: paymentAgg,
  })
}

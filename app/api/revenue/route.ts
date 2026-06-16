import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Lead } from "@/lib/models/Lead"
import { Payment } from "@/lib/models/Payment"

export async function GET(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()

  const { searchParams } = new URL(request.url)
  const assignedTo = searchParams.get("assignedTo")

  const leadFilter: Record<string, unknown> = {}
  if (assignedTo) leadFilter.assignedTo = assignedTo

  const [byCurrency, byStage, paymentAgg] = await Promise.all([
    Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: "$currency",
          pipeline: { $sum: "$value" },
          won: {
            $sum: { $cond: [{ $eq: ["$stage", "closed_won"] }, "$value", 0] },
          },
        },
      },
    ]),
    Lead.aggregate([
      { $match: leadFilter },
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
    ]),
    Payment.aggregate([
      {
        $match: { ...leadFilter, leadId: { $exists: true } },
      },
      {
        $group: {
          _id: "$currency",
          totalCollected: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amount", 0] },
          },
          totalPending: {
            $sum: { $cond: [{ $ne: ["$status", "paid"] }, "$amount", 0] },
          },
          paidCount: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
    ]),
  ])

  const totalLeads = await Lead.countDocuments(leadFilter)
  const wonLeads = await Lead.countDocuments({ ...leadFilter, stage: "closed_won" })

  const usdLeads = byCurrency.find((c) => c._id === "USD") || { pipeline: 0, won: 0 }
  const inrLeads = byCurrency.find((c) => c._id === "INR") || { pipeline: 0, won: 0 }

  const usdPayments = paymentAgg.find((p) => p._id === "USD") || {
    totalCollected: 0, totalPending: 0, paidCount: 0, totalCount: 0,
  }
  const inrPayments = paymentAgg.find((p) => p._id === "INR") || {
    totalCollected: 0, totalPending: 0, paidCount: 0, totalCount: 0,
  }

  return NextResponse.json({
    totalLeads,
    wonLeads,
    byCurrency: {
      USD: { pipeline: usdLeads.pipeline, won: usdLeads.won },
      INR: { pipeline: inrLeads.pipeline, won: inrLeads.won },
    },
    byStage,
    payments: {
      USD: usdPayments,
      INR: inrPayments,
    },
  })
}

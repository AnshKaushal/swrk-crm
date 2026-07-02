import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Payment } from "@/lib/models/Payment"
import { Lead } from "@/lib/models/Lead"
import { User } from "@/lib/models/User"
import { Commission } from "@/lib/models/Commission"
import { calculateCommission } from "@/lib/commission"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const leadId = searchParams.get("leadId")

  await connectDB()

  const filter: Record<string, any> = {}
  if (leadId) filter.leadId = leadId

  const payments = await Payment.find(filter)
    .populate("leadId", "name company")
    .sort({ createdAt: 1 })

  return NextResponse.json(payments)
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const body = await request.json()
  const { paymentId, ...update } = body

  if (!paymentId) {
    return NextResponse.json({ error: "paymentId required" }, { status: 400 })
  }

  const payment = await Payment.findById(paymentId)
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  if (update.status === "paid" && !payment.paidDate) {
    update.paidDate = new Date()
  }

  if (update.status === "pending") {
    update.paidDate = undefined
  }

  Object.assign(payment, update)
  await payment.save()

  if (update.status === "paid") {
    const existing = await Commission.findOne({ paymentId: payment._id })
    if (!existing) {
      const lead = await Lead.findById(payment.leadId).populate("assignedTo")
      if (lead) {
        const assignedUser = lead.assignedTo as unknown as { _id: string; role: string } | null
        if (assignedUser && assignedUser.role === "employee") {
          const { rate, amount, exchangeRate } = await calculateCommission(
            payment.amount,
            lead.value,
            payment.currency,
          )
          await Commission.create({
            userId: assignedUser._id,
            leadId: lead._id,
            paymentId: payment._id,
            dealValue: lead.value,
            paymentAmount: payment.amount,
            commissionRate: rate,
            commissionAmount: amount,
            currency: payment.currency,
            exchangeRate,
            dealName: lead.name,
          })
        }
      }
    }
  }

  if (update.status === "pending") {
    await Commission.findOneAndUpdate(
      { paymentId: payment._id },
      { $set: { status: "pending" }, $unset: { paidDate: 1 } },
    )
  }

  return NextResponse.json(payment)
}

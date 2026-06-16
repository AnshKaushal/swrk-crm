import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Payment } from "@/lib/models/Payment"

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

  return NextResponse.json(payment)
}

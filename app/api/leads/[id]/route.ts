import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Lead } from "@/lib/models/Lead"
import { Payment } from "@/lib/models/Payment"
import { Notification } from "@/lib/models/Notification"
import { AuditLog } from "@/lib/models/AuditLog"
import { PushSubscription as PushSubModel } from "@/lib/models/PushSubscription"
import { webpush } from "@/lib/webpush"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await connectDB()
  const body = await request.json()

  const lead = await Lead.findById(id)
  if (!lead)
    return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  if (
    session.user.role === "employee" &&
    lead.assignedTo.toString() !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const oldStage = lead.stage

  Object.assign(lead, body)
  await lead.save()

  if (body.stage === "closed_won" && oldStage !== "closed_won") {
    const existing = await Payment.countDocuments({ leadId: lead._id })
    if (existing === 0) {
      const value = lead.value
      const currency = lead.currency
      const now = new Date()

      const payments = [
        {
          leadId: lead._id,
          type: "advance" as const,
          percentage: 30,
          amount: Math.round(value * 0.3),
          currency,
          status: "pending" as const,
          dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
          milestoneDescription: "Advance payment (30%)",
        },
        {
          leadId: lead._id,
          type: "milestone" as const,
          percentage: 30,
          amount: Math.round(value * 0.3),
          currency,
          status: "pending" as const,
          milestoneDescription:
            "Milestone payment (30%) - set trigger description",
        },
        {
          leadId: lead._id,
          type: "completion" as const,
          percentage: 40,
          amount: Math.round(value * 0.4),
          currency,
          status: "pending" as const,
          milestoneDescription: "Completion payment (40%)",
        },
      ]

      await Payment.insertMany(payments)
    }
  }

  const populatedLead = await lead.populate(["assignedTo", "createdBy"])

  if (body.stage && body.stage !== oldStage) {
    await AuditLog.create({
      leadId: lead._id,
      userId: session.user.id,
      oldStage,
      newStage: body.stage,
    })
  }

  if (body.stage && body.stage !== oldStage) {
    const notification = await Notification.create({
      type: "lead_updated",
      message: `${session.user.name} moved ${lead.name} from ${oldStage} to ${body.stage}`,
      recipientRoles: ["super_admin", "admin", "manager"],
      relatedLead: lead._id,
    })

    const subscribers = await PushSubModel.find().populate("userId", "role")

    for (const sub of subscribers) {
      const user = sub.userId as unknown as { role: string }
      if (user && notification.recipientRoles.includes(user.role)) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: sub.keys },
            JSON.stringify({
              title: "Lead Stage Updated",
              body: notification.message,
              url: `/leads/${lead._id}`,
            }),
          )
        } catch {
          if (sub.endpoint) {
            await PushSubModel.deleteOne({ _id: sub._id })
          }
        }
      }
    }
  }

  return NextResponse.json(populatedLead)
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  await connectDB()

  await Lead.findByIdAndDelete(id)
  await Payment.deleteMany({ leadId: id })
  return NextResponse.json({ success: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import { Lead } from "@/lib/models/Lead"
import { Comment } from "@/lib/models/Comment"
import { Notification } from "@/lib/models/Notification"
import { PushSubscription as PushSubModel } from "@/lib/models/PushSubscription"
import { webpush } from "@/lib/webpush"

export async function GET(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()

  const { searchParams } = new URL(request.url)
  const assignedTo = searchParams.get("assignedTo")

  const filter: Record<string, unknown> = {}
  if (assignedTo) {
    filter.assignedTo = assignedTo
  } else if (session.user.role === "employee") {
    filter.assignedTo = session.user.id
  } else if (session.user.role === "manager") {
    const myEmployees = await User.find({ assignedManager: session.user.id }).select("_id").lean()
    const employeeIds = myEmployees.map((e) => e._id.toString())
    filter.$or = [
      { assignedTo: session.user.id },
      { assignedTo: { $in: employeeIds } },
    ]
  } else if (session.user.role === "admin") {
    const superAdmins = await User.find({ role: "super_admin" }).select("_id").lean()
    const superAdminIds = superAdmins.map((e) => e._id.toString())
    filter.assignedTo = { $nin: superAdminIds }
  }

  const leads = await Lead.find(filter)
    .populate("assignedTo", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .lean()

  const leadIds = leads.map((l: any) => l._id)
  const commentCounts = await Comment.aggregate([
    { $match: { leadId: { $in: leadIds } } },
    { $group: { _id: "$leadId", count: { $sum: 1 } } },
  ])

  const countMap: Record<string, number> = {}
  for (const cc of commentCounts) {
    countMap[cc._id.toString()] = cc.count
  }

  const enriched = leads.map((l: any) => ({
    ...l,
    commentCount: countMap[l._id.toString()] || 0,
  }))

  return NextResponse.json(enriched)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const body = await request.json()

  const lead = await Lead.create({
    name: body.name,
    company: body.company,
    email: body.email || "",
    phone: body.phone || "",
    stage: body.stage || "new",
    value: body.value || 0,
    currency: body.currency || "INR",
    notes: body.notes || "",
    assignedTo: body.assignedTo || session.user.id,
    createdBy: session.user.id,
  })

  const populatedLead = await lead.populate(["assignedTo", "createdBy"])

  const notification = await Notification.create({
    type: "lead_created",
    message: `${session.user.name} added a new lead: ${lead.name} from ${lead.company}`,
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
            title: "New Lead Created",
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

  return NextResponse.json(populatedLead, { status: 201 })
}

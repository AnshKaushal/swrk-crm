import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Comment } from "@/lib/models/Comment"
import { Notification } from "@/lib/models/Notification"
import { PushSubscription as PushSubModel } from "@/lib/models/PushSubscription"
import { webpush } from "@/lib/webpush"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await connectDB()

  const comments = await Comment.find({ leadId: id })
    .populate("userId", "name email")
    .sort({ createdAt: -1 })

  return NextResponse.json(comments)
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await connectDB()
  const body = await request.json()

  if (!body.text?.trim()) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 })
  }

  const comment = await Comment.create({
    leadId: id,
    userId: session.user.id,
    text: body.text.trim(),
  })

  const populated = await comment.populate("userId", "name email")

  const lead = await (await import("@/lib/models/Lead")).Lead.findById(id)
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 })

  const notification = await Notification.create({
    type: "lead_updated",
    message: `${session.user.name} commented on ${lead.name}`,
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
            title: "New Comment",
            body: notification.message,
            url: `/leads/${lead._id}`,
          }),
        )
      } catch {
        await PushSubModel.deleteOne({ _id: sub._id })
      }
    }
  }

  return NextResponse.json(populated, { status: 201 })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { Notification } from "@/lib/models/Notification"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()

  const notifications = await Notification.find({
    recipientRoles: session.user.role,
  })
    .populate("relatedLead", "name company")
    .sort({ createdAt: -1 })
    .limit(20)

  const unreadCount = await Notification.countDocuments({
    recipientRoles: session.user.role,
    read: false,
  })

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()

  await Notification.updateMany(
    { recipientRoles: session.user.role, read: false },
    { read: true },
  )

  return NextResponse.json({ success: true })
}

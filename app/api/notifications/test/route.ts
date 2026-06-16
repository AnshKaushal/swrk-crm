import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { PushSubscription } from "@/lib/models/PushSubscription"
import { webpush } from "@/lib/webpush"

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()

  const subs = await PushSubscription.find({ userId: session.user.id })
  if (subs.length === 0) {
    return NextResponse.json({ error: "No push subscription found. Enable notifications in Settings." }, { status: 400 })
  }

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        JSON.stringify({
          title: "SWRK CRM",
          body: "Test notification — push is working!",
          url: "/pipeline",
        }),
      ).catch(async () => {
        await PushSubscription.deleteOne({ _id: sub._id })
      }),
    ),
  )

  const succeeded = results.filter((r) => r.status === "fulfilled").length
  if (succeeded === 0) {
    return NextResponse.json({ error: "All subscriptions expired. Re-enable notifications in Settings." }, { status: 400 })
  }

  return NextResponse.json({ success: true, sent: succeeded })
}

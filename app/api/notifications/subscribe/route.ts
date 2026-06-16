import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { PushSubscription } from "@/lib/models/PushSubscription"

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const body = await request.json()

  await PushSubscription.findOneAndUpdate(
    { userId: session.user.id, endpoint: body.endpoint },
    {
      userId: session.user.id,
      endpoint: body.endpoint,
      keys: body.keys,
    },
    { upsert: true, returnDocument: "after" },
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const body = await request.json()

  await PushSubscription.deleteOne({
    userId: session.user.id,
    endpoint: body.endpoint,
  })

  return NextResponse.json({ success: true })
}

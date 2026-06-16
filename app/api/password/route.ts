import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await connectDB()
  const body = await request.json()

  const user = await User.findById(session.user.id)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const isValid = await bcrypt.compare(body.currentPassword, user.password)
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(body.newPassword, 12)
  user.password = hashedPassword
  user.mustChangePassword = false
  await user.save()

  return NextResponse.json({ success: true })
}

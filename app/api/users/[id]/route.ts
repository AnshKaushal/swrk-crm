import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || !["super_admin", "admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await connectDB()

  const user = await User.findById(id).select("-password").lean()
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

  return NextResponse.json(user)
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  await connectDB()

  const user = await User.findById(id)
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  if (user.role === "super_admin") {
    return NextResponse.json({ error: "Cannot delete super admin" }, { status: 400 })
  }

  await User.findByIdAndDelete(id)
  return NextResponse.json({ success: true })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { sendWelcomeEmail } from "@/lib/email"

export async function GET(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()

  const { searchParams } = new URL(request.url)
  const roleFilter = searchParams.get("role")
  const filter: Record<string, unknown> = {}
  if (roleFilter) filter.role = roleFilter

  const users = await User.find(filter)
    .select("-password")
    .populate("assignedManager", "name email")
    .sort({ createdAt: -1 })

  return NextResponse.json(users)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const body = await request.json()

  const existing = await User.findOne({ email: body.email.toLowerCase() })
  if (existing) {
    return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
  }

  const tempPassword = crypto.randomBytes(8).toString("hex")
  const hashedPassword = await bcrypt.hash(tempPassword, 12)

  const userData: Record<string, unknown> = {
    name: body.name,
    email: body.email.toLowerCase(),
    password: hashedPassword,
    role: body.role || "employee",
    mustChangePassword: true,
  }

  if (body.role === "employee" && body.assignedManager) {
    userData.assignedManager = body.assignedManager
  }

  const user = await User.create(userData)

  try {
    await sendWelcomeEmail(user.email, user.name, tempPassword)
  } catch (err) {
    console.error("Failed to send email:", err)
  }

  return NextResponse.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    mustChangePassword: true,
  }, { status: 201 })
}

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/lib/models/User"

export async function GET() {
  const session = await auth()
  if (!session || !["super_admin", "admin", "manager"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()

  const filter: Record<string, unknown> = { role: "employee" }
  if (session.user.role === "manager") {
    filter.assignedManager = session.user.id
  }

  const employees = await User.find(filter)
    .select("-password")
    .populate("assignedManager", "name email")
    .sort({ name: 1 })

  return NextResponse.json(employees)
}

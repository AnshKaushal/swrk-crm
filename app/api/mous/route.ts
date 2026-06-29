import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import { MOU } from "@/lib/models/MOU"

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const mous = await MOU.find().sort({ createdAt: -1 })
  return NextResponse.json(mous)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session || session.user.role !== "super_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await connectDB()
  const body = await request.json()

  if (!body.name || !body.email || !body.date) {
    return NextResponse.json({ error: "Name, email, and date are required" }, { status: 400 })
  }

  const mou = await MOU.create({
    name: body.name,
    email: body.email,
    date: new Date(body.date),
  })

  return NextResponse.json(mou, { status: 201 })
}

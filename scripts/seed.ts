import { connectDB } from "../lib/mongodb"
import { User } from "../lib/models/User"
import bcrypt from "bcryptjs"

async function seed() {
  await connectDB()

  const email = process.env.SEED_EMAIL || "founder@swrk.com"
  const password = process.env.SEED_PASSWORD || "admin123"
  const name = process.env.SEED_NAME || "Founder"

  const existing = await User.findOne({ email })
  if (existing) {
    console.log("Super admin already exists")
    process.exit(0)
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  await User.create({
    name,
    email,
    password: hashedPassword,
    role: "super_admin",
    mustChangePassword: false,
  })

  console.log(`Super admin created: ${email}`)
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})

import mongoose, { Schema, Document } from "mongoose"

export type UserRole = "super_admin" | "admin" | "manager" | "employee"

export interface IUser extends Document {
  name: string
  email: string
  password: string
  role: UserRole
  mustChangePassword: boolean
  assignedManager?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "manager", "employee"],
      default: "employee",
    },
    mustChangePassword: { type: Boolean, default: false },
    assignedManager: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
)

export const User = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema)

import mongoose, { Schema, Document } from "mongoose"

export interface IMOU extends Document {
  name: string
  email: string
  date: Date
  status: "pending" | "sent" | "signed"
  sentAt?: Date
  signedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const MOUSchema = new Schema<IMOU>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "signed"],
      default: "pending",
    },
    sentAt: { type: Date },
    signedAt: { type: Date },
  },
  { timestamps: true },
)

export const MOU = mongoose.models.MOU || mongoose.model<IMOU>("MOU", MOUSchema)

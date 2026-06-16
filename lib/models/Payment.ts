import mongoose, { Schema, Document, Types } from "mongoose"

export type PaymentType = "advance" | "milestone" | "completion"
export type PaymentStatus = "pending" | "paid" | "overdue"

export interface IPayment extends Document {
  leadId: Types.ObjectId
  type: PaymentType
  percentage: number
  amount: number
  currency: string
  status: PaymentStatus
  dueDate: Date
  paidDate?: Date
  milestoneDescription: string
  notes: string
  createdAt: Date
  updatedAt: Date
}

const PaymentSchema = new Schema<IPayment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    type: { type: String, enum: ["advance", "milestone", "completion"], required: true },
    percentage: { type: Number, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, enum: ["USD", "INR"], default: "INR" },
    status: { type: String, enum: ["pending", "paid", "overdue"], default: "pending" },
    dueDate: { type: Date },
    paidDate: { type: Date },
    milestoneDescription: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
)

PaymentSchema.index({ leadId: 1, type: 1 })

export const Payment =
  mongoose.models.Payment ?? mongoose.model<IPayment>("Payment", PaymentSchema)

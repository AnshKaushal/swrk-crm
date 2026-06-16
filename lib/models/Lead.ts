import mongoose, { Schema, Document, Types } from "mongoose"

export type LeadStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "closed_won"
  | "closed_lost"

export type CurrencyCode = "USD" | "INR"

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  INR: "₹",
}

export function formatCurrency(value: number, currency: CurrencyCode = "USD") {
  const symbol = CURRENCY_SYMBOLS[currency]
  return `${symbol}${value.toLocaleString("en-US")}`
}

export interface ILead extends Document {
  name: string
  company: string
  email: string
  phone: string
  stage: LeadStage
  value: number
  currency: CurrencyCode
  notes: string
  assignedTo: Types.ObjectId
  createdBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true },
    company: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    stage: {
      type: String,
      enum: [
        "new",
        "contacted",
        "qualified",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      default: "new",
    },
    value: { type: Number, default: 0 },
    currency: { type: String, enum: ["USD", "INR"], default: "INR" },
    notes: { type: String, default: "" },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
)

export const Lead = mongoose.models.Lead ?? mongoose.model<ILead>("Lead", LeadSchema)

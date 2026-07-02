import mongoose, { Schema, Document, Types } from "mongoose"

export type CommissionStatus = "pending" | "paid"

export interface ICommission extends Document {
  userId: Types.ObjectId
  leadId: Types.ObjectId
  paymentId: Types.ObjectId
  dealValue: number
  paymentAmount: number
  commissionRate: number
  commissionAmount: number
  currency: string
  status: CommissionStatus
  exchangeRate?: number
  paidDate?: Date
  dealName: string
  createdAt: Date
  updatedAt: Date
}

const CommissionSchema = new Schema<ICommission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true },
    dealValue: { type: Number, required: true },
    paymentAmount: { type: Number, required: true },
    commissionRate: { type: Number, required: true },
    commissionAmount: { type: Number, required: true },
    currency: { type: String, enum: ["USD", "INR"], default: "INR" },
    status: { type: String, enum: ["pending", "paid"], default: "pending" },
    exchangeRate: { type: Number },
    paidDate: { type: Date },
    dealName: { type: String, default: "" },
  },
  { timestamps: true },
)

CommissionSchema.index({ paymentId: 1 }, { unique: true })
CommissionSchema.index({ userId: 1 })
CommissionSchema.index({ leadId: 1 })

export const Commission =
  mongoose.models.Commission ?? mongoose.model<ICommission>("Commission", CommissionSchema)

import mongoose, { Schema, Document, Types } from "mongoose"

export interface IAuditLog extends Document {
  leadId: Types.ObjectId
  userId: Types.ObjectId
  oldStage: string
  newStage: string
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    oldStage: { type: String, required: true },
    newStage: { type: String, required: true },
  },
  { timestamps: true },
)

AuditLogSchema.index({ leadId: 1, createdAt: -1 })

export const AuditLog =
  mongoose.models.AuditLog ??
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema)

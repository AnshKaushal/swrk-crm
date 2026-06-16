import mongoose, { Schema, Document, Types } from "mongoose"

export interface INotification extends Document {
  type: "lead_created" | "lead_updated"
  message: string
  recipientRoles: string[]
  relatedLead: Types.ObjectId
  read: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ["lead_created", "lead_updated"],
      required: true,
    },
    message: { type: String, required: true },
    recipientRoles: [{ type: String }],
    relatedLead: { type: Schema.Types.ObjectId, ref: "Lead" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export const Notification =
  mongoose.models.Notification ??
  mongoose.model<INotification>("Notification", NotificationSchema)

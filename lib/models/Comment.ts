import mongoose, { Schema, Document, Types } from "mongoose"

export interface IComment extends Document {
  leadId: Types.ObjectId
  userId: Types.ObjectId
  text: string
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true },
)

CommentSchema.index({ leadId: 1, createdAt: -1 })

export const Comment =
  mongoose.models.Comment ?? mongoose.model<IComment>("Comment", CommentSchema)

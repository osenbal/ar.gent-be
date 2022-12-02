import { Schema, model, Document, Types } from "mongoose";
import AppliedJobUser, { EStatusApprove } from "@interfaces/appliedJobUser.interface";
import { string } from "joi";

const AppliedJobUserSchema: Schema = new Schema({
  userId: {
    type: Types.ObjectId,
    required: true,
  },
  jobId: {
    type: Types.ObjectId,
    required: true,
  },
  isApprove: {
    type: String,
    required: true,
    enum: Object.values(EStatusApprove),
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const AppliedJobUserModel = model<AppliedJobUser & Document>("AppliedJobUser", AppliedJobUserSchema);

export default AppliedJobUserModel;

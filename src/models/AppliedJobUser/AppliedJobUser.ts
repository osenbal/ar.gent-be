import { Schema, model, Document, Types } from "mongoose";
import AppliedJobUser from "@interfaces/appliedJobUser.interface";

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
    type: Boolean,
    required: true,
    default: false,
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

import { Types } from "mongoose";
export default interface AppliedJobUser {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  isApprove: EStatusApprove;
  createdAt: Date;
  deletedAt: Date | null;
}

export enum EStatusApprove {
  APPROVED = "approved",
  REJECTED = "rejected",
  PENDING = "pending",
}

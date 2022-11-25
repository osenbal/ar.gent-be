import { Types } from "mongoose";
export default interface AppliedJobUser {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  jobId: Types.ObjectId;
  isApprove: boolean;
  createdAt: Date;
  deletedAt: Date | null;
}

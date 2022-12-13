import { Schema, model } from "mongoose";
import { IReport_User } from "@interfaces/user.interface";

const UserReport = new Schema<IReport_User>({
  userReportedId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  userReportById: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const UserReportModel = model<IReport_User>("UserReport", UserReport);

export default UserReportModel;

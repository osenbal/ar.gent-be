import { model, Schema } from "mongoose";
import { IVerification_User } from "@interfaces/user.interface";

const UserVerificationSchema = new Schema<IVerification_User>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: Date,
});

const UserVerificationModel = model<IVerification_User>("UserVerification", UserVerificationSchema);

export default UserVerificationModel;

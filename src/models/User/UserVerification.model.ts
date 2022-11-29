import { model, Schema } from "mongoose";
import { UserVerification } from "@interfaces/user.interface";

const UserVerificationSchema = new Schema<UserVerification>({
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

const UserVerificationModel = model<UserVerification>("UserVerification", UserVerificationSchema);

export default UserVerificationModel;

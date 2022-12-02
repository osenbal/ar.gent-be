import { Schema, model } from "mongoose";
import { IResetPassword_User } from "@interfaces/user.interface";

const UserResetPasswordSchema = new Schema<IResetPassword_User>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  uniqueString: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

const UserResetPasswordModel = model<IResetPassword_User>("UserResetPassword", UserResetPasswordSchema);

export default UserResetPasswordModel;

import { Schema, model } from 'mongoose';
import { IResetPassword } from '@interfaces/user.interface';

const UserResetPasswordSchema = new Schema<IResetPassword>({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
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

const UserResetPasswordModel = model<IResetPassword>(
  'UserResetPassword',
  UserResetPasswordSchema
);

export default UserResetPasswordModel;

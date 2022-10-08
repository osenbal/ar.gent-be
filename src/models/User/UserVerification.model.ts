import { model, Schema } from 'mongoose';
import { UserVerification } from '@interfaces/user.interface';

const UserVerificationSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  uniqueString: String,
  createdAt: Date,
  expiresAt: Date,
});

const UserVerificationModel = model<UserVerification>(
  'UserVerification',
  UserVerificationSchema
);

export default UserVerificationModel;

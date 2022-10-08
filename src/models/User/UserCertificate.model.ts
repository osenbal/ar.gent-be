import { model, Schema } from 'mongoose';
import { ICertificate } from '@interfaces/user.interface';

const UserCertificateSchema = new Schema<ICertificate>({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  url: { type: String },
  issueAt: { type: Date },
  expireAt: { type: Date },
});

const UserCertificateModel = model<ICertificate>(
  'UserCertificate',
  UserCertificateSchema
);

export default UserCertificateModel;

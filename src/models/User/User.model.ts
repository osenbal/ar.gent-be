import IUser, { EGender, IAddress } from '@interfaces/user.interface';
import { model, Schema } from 'mongoose';
import { ROLE_USER } from '@config/constant/constant';

const UserSchema = new Schema<IUser>({
  banner: {
    type: String,
  },
  photo: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  about: {
    type: String,
  },
  birthday: {
    type: Date,
    required: true,
  },
  address: {
    type: Object as () => IAddress,
  },
  gender: {
    type: String,
    enum: Object.values(EGender),
    required: true,
  },
  role: {
    type: String,
    default: ROLE_USER,
  },
  cv: {
    type: String,
  },
  portfolio_url: {
    type: [String],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: new Date(),
  },
  updatedAt: {
    type: Date,
    default: null,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
});

const UserModel = model<IUser>('User', UserSchema);

export default UserModel;

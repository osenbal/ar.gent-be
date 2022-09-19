import { model, Schema, Document } from 'mongoose';
import { User } from '@interfaces/user.interface';

const UserSchema: Schema = new Schema({
  photo: {
    type: String,
    required: false,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  gender: {
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
  description: {
    type: String,
    required: false,
    default: '',
  },
  role: {
    type: String,
    default: 'user',
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: String,
    default: new Date().toISOString(),
  },
  deletedAt: {
    type: String,
    default: null,
  },
});

const UserModel = model<User & Document>('User', UserSchema);

export default UserModel;

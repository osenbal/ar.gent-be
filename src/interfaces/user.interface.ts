import { Types } from 'mongoose';

export interface UserVerification {
  userId: Types.ObjectId;
  uniqueString: string;
  createdAt: Date;
  expiresAt: Date;
}

export enum EGender {
  male = 'male',
  female = 'female',
}

export interface IAddress {
  street: string;
  city: string;
  country: string;
  zipCode: number;
}

export default interface IUser {
  _id: Types.ObjectId;
  banner: string;
  photo: string;
  firstName: string; // required
  lastName: string; // required
  email: string; // required
  password: string; // required
  phoneNumber: string; // required
  about: string;
  birthday: Date; // required
  address: IAddress; // required
  gender: EGender; // required
  role: string; // required
  cv: string;
  portfolio_url: Array<string>;
  verified: boolean; // required
  createdAt: Date; // required
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface ICertificate {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  image: string;
  url: string;
  issueAt: Date;
  expireAt: Date;
}

export interface ISkill {
  _id: Types.ObjectId;
  name: string;
}

export interface ISkill_User {
  userId: Types.ObjectId;
  skillId: Types.ObjectId;
}

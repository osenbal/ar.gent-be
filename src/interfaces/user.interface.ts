import { Types } from "mongoose";

export enum EGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

export enum ERole {
  ADMIN = "admin",
  USER = "user",
}

export interface IAddress {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: number | null;
}

export interface IEducation {
  school: string;
  degree: string;
  location: string;
  startDate: Date;
  endDate: Date | null;
  currentEducation: boolean;
}

export interface IExperience {
  company: string;
  position: string;
  isPresent: boolean;
  startDate: Date;
  endDate: Date | null;
  description: string;
  location: string;
}

export interface ICertificate {
  title: string; // required
  urlImage: string; // required
  licenseNumber: string; //required
  issueAt: Date;
  expireAt: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface IUserRegister {
  avatar: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  gender: EGender;
  birthday: Date;
  email: string;
  password: string;
}

export default interface IUser {
  _id: Types.ObjectId;
  banner: string;
  avatar: string; // avatar url image
  username: string; // required
  fullName: string; // required
  email: string; // required
  password: string; // required
  phoneNumber: string; // required
  about: string;
  birthday: Date; // required
  address: IAddress; // required
  gender: EGender; // required
  role: string; // required
  cv: string; // cv url file
  skill: string[];
  education: IEducation[];
  experience: IExperience[];
  certificate: ICertificate[];
  portfolioUrl: string[];
  verified: boolean; // required
  status: boolean; // required
  createdAt: Date; // required
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface UserVerification {
  userId: Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export interface IResetPassword {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  uniqueString: string;
  createdAt: Date;
  expiresAt: Date;
}

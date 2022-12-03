import { Types } from "mongoose";
import { ICountry, ICity, IState } from "country-state-city";

export interface IAddress_User {
  street: string;
  zipCode: number | null;
  city: ICity;
  state: IState;
  country: ICountry;
}
export interface IEducation_User {
  school: string;
  degree: string;
  location: string;
  currentEducation: boolean;
  startDate: Date;
  endDate: Date | null;
}
export interface IExperience_User {
  company: string;
  position: string;
  isPresent: boolean;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date | null;
}

export interface IRegister_User {
  avatar: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  gender: EGender;
  birthday: Date;
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
  cv: string; // cv url file
  skill: string[];
  portfolioUrl: string[];
  verified: boolean; // required
  status: boolean; // required
  birthday: Date; // required
  address: IAddress_User; // required
  gender: EGender; // required
  education: IEducation_User[];
  experience: IExperience_User[];
  createdAt: Date; // required
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export interface IVerification_User {
  userId: Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}
export interface IResetPassword_User {
  _id: Types.ObjectId;
  uniqueString: string;
  userId: Types.ObjectId;
  createdAt: Date;
  expiresAt: Date;
}

export enum EGender {
  MALE = "male",
  FEMALE = "female",
  OTHER = "other",
}

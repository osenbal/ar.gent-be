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

export interface IEducation {
  school: string;
  degree: string;
  location: string;
  startDate: Date;
  endDate: Date;
  description: string;
}

export interface IExperience {
  company: string;
  position: string;
  isPresent: boolean;
  startDate: Date;
  endDate: Date;
  description: string;
  location: string;
}

export interface ICertificate {
  title: string; // required
  urlImage: string; // required
  startDate: Date;
  endDate: Date;
  licenseNumber: string; //required
  description: string;
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
  portfolio_url: string[];
  verified: boolean; // required
  createdAt: Date; // required
  updatedAt: Date | null;
  deletedAt: Date | null;
}

// export interface ICertificate {
//   _id: Types.ObjectId;
//   userId: Types.ObjectId;
//   name: string;
//   image: string;
//   url: string;
//   issueAt: Date;
//   expireAt: Date;
// }

// export interface ISkill {
//   _id: Types.ObjectId;
//   name: string;
// }

// export interface ISkill_User {
//   userId: Types.ObjectId;
//   skillId: Types.ObjectId;
// }

export interface IResetPassword {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  uniqueString: string;
  createdAt: Date;
  expiresAt: Date;
}

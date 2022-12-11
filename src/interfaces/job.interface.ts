import { ICity, ICountry, IState } from "country-state-city";
import { Types } from "mongoose";

export enum EJobType {
  INTERNSHIP = "internship",
  FULL_TIME = "full-time",
  PART_TIME = "part-time",
  CONTRACT = "contract",
}

export enum EJobLevel {
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
}

export enum EJobWorkPlace {
  REMOTE = "remote",
  OFFICE = "office",
  HYBRID = "hybrid",
}

export interface IJobCategory {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  categoryId: Types.ObjectId;
}

export interface ICategory {
  _id: Types.ObjectId;
  name: string;
}

export interface IAddress {
  country: ICountry;
  state: IState;
  city: ICity;
}

export interface ICreateBody {
  title: string;
  description: string;
  type: EJobType;
  level: EJobLevel;
  workPlace: EJobWorkPlace;
  country: ICountry;
  state: IState;
  city: ICity;
  salary: number;
}

export interface INewJob {
  userId: Types.ObjectId;
  title: string;
  description: string;
  type: EJobType;
  level: EJobLevel;
  workPlace: EJobWorkPlace;
  location: IAddress;
  salary: number;
}

export default interface IJob {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  description: string;
  type: EJobType;
  level: EJobLevel;
  workPlace: EJobWorkPlace;
  location: IAddress;
  salary: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

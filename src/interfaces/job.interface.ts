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

export default interface IJob {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  username: string;
  title: string;
  description: string;
  type: EJobType;
  level: EJobLevel;
  workPlace: EJobWorkPlace;
  location: string;
  salary: number;
  isClosed: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

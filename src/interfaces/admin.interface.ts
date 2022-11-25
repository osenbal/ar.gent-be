import { Types } from "mongoose";

export default interface IAdmin {
  _id: Types.ObjectId;
  avatar: string;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

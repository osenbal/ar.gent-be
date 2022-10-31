import { Types } from 'mongoose';

export default interface IReport {
  _id: Types.ObjectId;
  reported: Types.ObjectId;
  title: string;
  description: string;
  createdAt: Date;
  deletedAt: Date | null;
}

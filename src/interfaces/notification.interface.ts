import { Types } from 'mongoose';

export enum ITypeNotification {
  Job = 'Job',
  Announcement = 'Announcement',
  Message = 'Message',
}

export default interface INotification {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: ITypeNotification;
  title: string;
  message: string;
  url: string;
  createdAt: Date;
  deletedAt: Date | null;
}

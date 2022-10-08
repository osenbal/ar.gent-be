import { Request } from 'express';
import IUser from '@interfaces/user.interface';

export interface IDataStoredInToken {
  _id: string;
  role: string;
}

export interface ITokenData {
  token: string;
  expiresIn: number;
}

export interface IRequestWithUser extends Request {
  user: IUser;
}

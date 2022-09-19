import { Request } from 'express';
import { User } from '@interfaces/user.interface';

export interface DataStoredInToken {
  _id: string;
  role: string;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

export interface RequestWithUser extends Request {
  user: User;
}

import { Request } from "express";
import IUser from "@interfaces/user.interface";
import IAdmin from "./admin.interface";

export interface IDataStoredInToken {
  _id: string;
}

export interface ITokenData {
  token: string;
  expiresIn: number;
}

export interface IRequestWithUser extends Request {
  user: IUser;
}

export interface IRequestWithAdmin extends Request {
  admin: IAdmin;
}

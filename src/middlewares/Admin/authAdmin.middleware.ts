import { IRequestWithAdmin } from "@/interfaces/auth.interface";
import { verify } from "jsonwebtoken";
import AdminModel from "@/models/Admin/Admin.model";
import { IDataStoredInToken } from "@interfaces/auth.interface";
import { Response, NextFunction } from "express";
import { HttpException } from "@exceptions/HttpException";
import { ACCESS_TOKEN_SECRET } from "@config/config";

const authAdminMiddleware = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const { adminAuth } = req.cookies;

    if (adminAuth) {
      const secretKey: string = ACCESS_TOKEN_SECRET;
      const verificationResponse = (await verify(adminAuth, secretKey)) as IDataStoredInToken;

      const adminId = verificationResponse._id;
      const findAdmin = await AdminModel.findById(adminId).lean().exec();

      if (findAdmin) {
        req.admin = findAdmin;
        next();
      } else {
        next(new HttpException(401, "Unauthorized"));
      }
    } else {
      next(new HttpException(404, "Authentication token missing"));
    }
  } catch (error) {
    next(new HttpException(401, "Wrong authentication token"));
  }
};

export default authAdminMiddleware;

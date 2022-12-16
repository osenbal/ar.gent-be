import { Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import AdminModel from "@/models/Admin/Admin.model";
import { IRequestWithAdmin } from "@/interfaces/auth.interface";
import { IDataStoredInToken } from "@interfaces/auth.interface";
import { ACCESS_TOKEN_SECRET } from "@config/config";
import { HttpException } from "@exceptions/HttpException";

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
        next(new HttpException(404, "User not found"));
      }
    } else {
      next(new HttpException(401, "Unauthorized"));
    }
  } catch (error) {
    next(new HttpException(401, "Unauthorized"));
  }
};

export default authAdminMiddleware;

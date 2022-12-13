import { Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import UserModel from "@/models/User/User.model";
import { HttpException } from "@exceptions/HttpException";
import { ACCESS_TOKEN_SECRET } from "@config/config";
import { IDataStoredInToken } from "@interfaces/auth.interface";
import { IRequestWithUser } from "@interfaces/auth.interface";

const authMiddleware = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { Authorization } = req.cookies;

    if (Authorization) {
      const secretKey: string = ACCESS_TOKEN_SECRET;
      const verificationResponse = (await verify(Authorization, secretKey)) as IDataStoredInToken;

      const userId = verificationResponse._id;
      const findUser = await UserModel.findById(userId).lean().exec();

      if (!findUser.status) {
        res.clearCookie("Authorization", {
          secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
          httpOnly: true,
          sameSite: "none",
        });

        res.clearCookie("refreshToken", {
          httpOnly: true,
          secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
          sameSite: "none",
        });

        next(new HttpException(409, "account has been banned"));
      }

      if (findUser) {
        req.user = findUser;
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

export default authMiddleware;

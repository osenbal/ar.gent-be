import { IRequestWithUser } from "@interfaces/auth.interface";
import { NextFunction, Response } from "express";
import { HttpException } from "@/exceptions/HttpException";

export const authPolicyMiddleware = (req: IRequestWithUser, res: Response, next: NextFunction) => {
  if (req.user._id.toString() !== req.params.id) {
    return res.status(401).json(new HttpException(401, "Unauthorize (not allowed)"));
  }

  next();
};

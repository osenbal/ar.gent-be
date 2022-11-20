import { Request, Response, NextFunction } from "express";
import AuthService from "@services/auth.service";
import { HttpException } from "@exceptions/HttpException";
import { IDataStoredInToken, IRequestWithUser } from "@interfaces/auth.interface";
import UserModel from "@/models/User/User.model";
import jwt from "jsonwebtoken";

//  @desc initialized object AuthService
const authService = new AuthService();

// @desc Login user
// @route POST /auth/login
// @access Public
export const logIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;
    const { refreshTokenData, accessToken, userId } = await authService.login(userData);

    res.cookie("Authorization", accessToken.token, {
      secure: true,
      httpOnly: true,
      domain: process.env.ORIGIN,
      maxAge: accessToken.expiresIn,
    });

    res.cookie("refreshToken", refreshTokenData.token, {
      secure: true,
      httpOnly: true,
      domain: process.env.ORIGIN,
      maxAge: refreshTokenData.expiresIn,
    });

    res.status(200).json({ code: 200, message: "OK", data: { userId } });
  } catch (error) {
    next(error);
  }
};

// @desc Refresh
// @route get /auth/refresh
// @access Private - because access token has expired
export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = req.cookies;
    if (!cookies) throw new HttpException(400, "Bad request");

    const { Authorization } = cookies;
    if (Authorization) {
      const verifyToken = await authService.verifyAccessToken(Authorization);

      if (verifyToken) {
        const { _id } = verifyToken;
        const userFound = await UserModel.findById(_id).lean().exec();

        if (!userFound) throw new HttpException(404, "User not found");

        return res.status(200).json({ code: 200, message: "OK", data: { _id } });
      }
    }

    if (!cookies?.refreshToken) {
      return res.status(401).json({ code: 401, message: "Unauthorized" });
    }

    const refreshToken = cookies.refreshToken;

    const { refreshTokenData, accessToken } = await authService.refresh(refreshToken);

    res.cookie("Authorization", accessToken.token, {
      secure: true,
      httpOnly: true,
      domain: process.env.ORIGIN,
      maxAge: accessToken.expiresIn,
    });

    res.cookie("refreshToken", refreshTokenData.token, {
      secure: true,
      httpOnly: true,
      domain: process.env.ORIGIN,
      maxAge: refreshTokenData.expiresIn,
    });

    // get id from access token
    const { _id } = jwt.decode(accessToken.token) as IDataStoredInToken;

    res.status(200).json({ code: 200, message: "OK", data: { accessToken, refreshToken, _id } });
  } catch (error) {
    next(error);
  }
};

// @desc logout
// @route POST /auth/logout
// @access Private - just to clear cookie if exist
export const logout = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.Authorization) return res.status(204).json({ code: 204, message: "No Auth Token" });

    res.clearCookie("Authorization", {
      secure: true,
      httpOnly: true,
      domain: process.env.ORIGIN,
      sameSite: "none",
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      domain: process.env.ORIGIN,
      sameSite: "none",
    });

    return res.status(200).json({ code: 200, message: "Cookie Cleared" });
  } catch (error) {
    next(error);
  }
};

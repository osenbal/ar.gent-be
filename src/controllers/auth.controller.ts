import { Request, Response, NextFunction } from "express";
import AuthService from "@services/auth.service";
import { HttpException } from "@exceptions/HttpException";
import UserVerificationModel from "@models/User/UserVerification.model";
import UserResetPasswordModel from "@models/User/UserResetPassword.model";
import { IDataStoredInToken, IRequestWithUser } from "@interfaces/auth.interface";
import UserModel from "@/models/User/User.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MailService } from "@services/mail.service";
import { CURRENT_URL } from "@/config/config";

//  @desc initialized object AuthService
const authService = new AuthService();
const mailService = new MailService();
const user = UserModel;
const userResetPassword = UserResetPasswordModel;

// @desc Login user
// @route POST /auth/login
// @access Public
export const logIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log(JSON.stringify(process.env.NODE_ENV) == JSON.stringify("developmentBackend"));
    console.log(process.env.NODE_ENV);
    const userData = req.body;
    const { refreshTokenData, accessToken, userId } = await authService.login(userData);

    res.cookie("Authorization", accessToken.token, {
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      httpOnly: true,
      sameSite: "none",
      maxAge: accessToken.expiresIn,
    });

    res.cookie("refreshToken", refreshTokenData.token, {
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      httpOnly: true,
      sameSite: "none",
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
        const userFound = await user.findById(_id).lean().exec();

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
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      httpOnly: true,
      sameSite: "none",
      maxAge: accessToken.expiresIn,
    });

    res.cookie("refreshToken", refreshTokenData.token, {
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      httpOnly: true,
      sameSite: "none",
      maxAge: refreshTokenData.expiresIn,
    });

    // get id from access token
    const { _id } = jwt.decode(accessToken.token) as IDataStoredInToken;

    res.status(200).json({ code: 200, message: "OK", data: { accessToken, refreshTokenData, _id } });
  } catch (error) {
    next(error);
  }
};

// @desc logout
// @route POST /auth/logout
// @access Private - just to clear cookie if exist
export const logout = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
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

    return res.status(200).json({ code: 200, message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

// @desc Request Reset password
// @route POST /auth/reset-password
// @access Public
export const requestResetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const userFound = await user.findOne({ email }).exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    // if (!userFound.verified) {
    //   return res.status(409).json(new HttpException(409, "User not verified"));
    // }

    const findUserResetPassword = await userResetPassword
      .findOne({
        userId: userFound._id,
      })
      .exec();

    if (findUserResetPassword) {
      if (findUserResetPassword?.expiresAt.getTime() < Date.now()) {
        findUserResetPassword.remove();
      } else {
        return res.status(409).json(new HttpException(409, "User already requested check your email"));
      }
    }
    return mailService.sendEmailResetPassword({ _id: userFound._id, email }, res);
  } catch (error) {
    next(error);
  }
};

// @desc Reset password
// @route POST /auth/reset-password/:uniqueString
// @access Private
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { uniqueString } = req.params;
    const { password } = req.body;

    if (!uniqueString || !password) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const matchUniqueString = jwt.verify(uniqueString, process.env.RESET_PASSWORD_KEY) as IDataStoredInToken;

    if (!matchUniqueString) {
      return res.status(401).json(new HttpException(401, "Bad Request"));
    }

    const userFound = await user.findById(matchUniqueString._id).exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const findUserResetPassword = await userResetPassword
      .findOne({
        userId: matchUniqueString._id,
        uniqueString: uniqueString,
      })
      .exec();

    if (findUserResetPassword) {
      if (findUserResetPassword.expiresAt.getTime() < Date.now()) {
        findUserResetPassword.remove();
        return res.status(404).json(new HttpException(404, "Link expired"));
      }

      const hashPasswordOld = userFound.password;
      const passwordOld = await bcrypt.compare(password, hashPasswordOld);

      if (passwordOld) {
        return res.status(409).json(new HttpException(409, "Password is the same"));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      user
        .updateOne({ _id: matchUniqueString._id }, { password: hashedPassword })
        .then(() => {
          findUserResetPassword.remove();
          return res.status(200).json(new HttpException(200, "Password success updated"));
        })
        .catch(() => {
          return res.status(500).json(new HttpException(500, "Internal Server Error"));
        });
    } else {
      return res.status(404).json(new HttpException(404, "link expired"));
    }

    // const compareUniqueString: boolean = await bcrypt.compare(uniqueString, hashedUniqueString);
  } catch (error) {
    next(error);
  }
};

export const checkUniqueStringResetPassword = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { uniqueString } = req.params;

    if (!uniqueString) return res.status(400).json(new HttpException(400, "Bad Request"));

    const matchUniqueString = jwt.verify(uniqueString, process.env.RESET_PASSWORD_KEY) as IDataStoredInToken;

    if (!matchUniqueString) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(matchUniqueString._id).exec();

    if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

    const userResetData = await userResetPassword.findOne({ user: userFound._id }).exec();

    if (!userResetData) return res.status(404).json(new HttpException(404, "User not found"));

    return res.status(200).json({
      code: 200,
      message: `OK`,
      data: userResetData,
    });
  } catch (error) {
    next(error);
  }
};

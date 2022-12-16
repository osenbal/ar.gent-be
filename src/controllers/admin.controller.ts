import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AdminModel from "@/models/Admin/Admin.model";
import AuthService from "@services/auth.service";
import UserModel from "@/models/User/User.model";
import JobModel from "@/models/Job.model";
import AppliedJobUserModel from "@/models/AppliedJobUser/AppliedJobUser";
import UserResetPasswordModel from "@/models/User/UserResetPassword.model";
import UserVerificationModel from "@/models/User/UserVerification.model";
import { IDataStoredInToken, IRequestWithAdmin } from "@/interfaces/auth.interface";
import { HttpException } from "@exceptions/HttpException";
import IAdmin from "@/interfaces/admin.interface";

// --------------------------------------------------------------------------------------------

const admin = AdminModel;
const user = UserModel;
const userResetPassword = UserResetPasswordModel;
const userVerification = UserVerificationModel;
const applyJobUser = AppliedJobUserModel;

// --------------------------------------------------------------------------------------------

const authService = new AuthService();

// --------------------------------------------------------------------------------------------

export const createNewAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      const { username, email, password } = req.body;

      if (!username || !email || !password) return res.status(400).json(new HttpException(400, "Invalid user data received"));

      const findAdmin = await admin
        .findOne({
          email,
        })
        .lean();

      if (findAdmin) return res.status(409).json(new HttpException(409, `${email} have already exists`));

      const duplicateUsername = await admin
        .findOne({
          username,
        })
        .lean();

      if (duplicateUsername) {
        return res.status(409).json(new HttpException(409, `${username} have already exists`));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newAdminObject = {
        username,
        email,
        password: hashedPassword,
      };

      const createAdmin = await admin.create(newAdminObject);

      if (createAdmin) {
        return res.status(200).json({ code: 200, message: "OK", data: createAdmin });
      } else {
        return res.status(500).json(new HttpException(500, `server error`));
      }
    } else {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }
  } catch (error) {
    next(error);
  }
};

export const loginAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      const adminData = req.body;
      const { refreshTokenData, accessToken, adminId } = await authService.loginAdmin(adminData);

      res.cookie("adminAuth", accessToken.token, {
        secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
        httpOnly: true,
        sameSite: "none",
        maxAge: accessToken.expiresIn,
      });

      res.cookie("adminRefreshToken", refreshTokenData.token, {
        secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
        httpOnly: true,
        sameSite: "none",
        maxAge: refreshTokenData.expiresIn,
      });

      res.status(200).json({ code: 200, message: "OK", data: { adminId } });
    } else {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }
  } catch (error) {
    next(error);
  }
};

export const refreshTokenAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = req.cookies;
    if (!cookies) throw new HttpException(400, "Bad request");

    const { adminAuth } = cookies;
    if (adminAuth) {
      const verifyToken = await authService.verifyAccessTokenAdmin(adminAuth);

      if (verifyToken) {
        const { _id } = verifyToken;
        const adminFound = await admin.findById(_id).lean().exec();

        if (!adminFound) throw new HttpException(404, "User not found");

        return res.status(200).json({ code: 200, message: "OK", data: { _id } });
      }
    }

    if (!cookies?.adminRefreshToken) {
      return res.status(401).json({ code: 401, message: "Unauthorized" });
    }

    const adminRefreshToken = cookies.adminRefreshToken;

    const { accessToken } = await authService.refreshAdmin(adminRefreshToken);

    res.cookie("adminAuth", accessToken.token, {
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      httpOnly: true,
      sameSite: "none",
      maxAge: accessToken.expiresIn,
    });

    console.log("========================================== set new refresh admin");
    // get id from access token
    const { _id } = jwt.decode(accessToken.token) as IDataStoredInToken;

    res.status(200).json({ code: 200, message: "OK", data: { accessToken, _id } });
  } catch (error) {
    next(error);
  }
};

export const logoutAdmin = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    res.clearCookie("adminAuth", {
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      httpOnly: true,
      sameSite: "none",
    });

    res.clearCookie("adminRefreshToken", {
      httpOnly: true,
      secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
      sameSite: "none",
    });

    return res.status(200).json({ code: 200, message: "Logged out" });
  } catch (error) {
    next(error);
  }
};

export const getCurrentAdmin = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const { adminId } = req.params;

    if (!adminId) throw new HttpException(400, "Bad request");

    const adminFound = await admin.findById(adminId).lean().exec();

    if (!adminFound) throw new HttpException(404, "User not found");

    return res.status(200).json({ code: 200, message: "OK", data: adminFound });
  } catch (error) {
    next(error);
  }
};

export const getAllUser = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    if (req.query.page && req.query.limit) {
      const page: number = parseInt(req.query.page as string) || 0;
      const limit: number = parseInt(req.query.limit as string) || 10;
      const search = req.query.search || "";
      const offset: number = page * limit;
      const totalRows = await user
        .countDocuments({
          $or: [
            { username: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        })
        .exec();
      const totalPage = Math.ceil(totalRows / limit);
      const resultData = await user
        .find({
          $or: [
            { username: { $regex: search, $options: "i" } },
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec();

      if (resultData) {
        const total = await user.countDocuments();
        return res
          .status(200)
          .json({ code: 200, message: "OK", data: resultData, ofsset: offset, page, limit, totalRows, totalPage, totalUser: total });
      } else {
        return res.status(404).json(new HttpException(404, "User not found"));
      }
    } else {
      const users = await user.find().lean();
      if (users) {
        return res.status(200).json({ code: 200, message: "OK", data: users });
      } else {
        return res.status(404).json(new HttpException(404, "User not found"));
      }
    }
  } catch (error) {
    next(error);
  }
};

export const bannedUser = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const { _id } = req.admin;
    const { userId } = req.params;
    const userFound = await user.findById(userId).lean();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const bannedUser = await user.findById(userId).updateOne({ status: !userFound.status });

    if (bannedUser) {
      const bannedUser = await user.findById(userId).lean();

      return res.status(200).json({ code: 200, message: "OK", data: bannedUser });
    } else {
      return res.status(500).json(new HttpException(500, "Server error"));
    }
  } catch (error) {
    next(error);
  }
};

export const deleteUsers = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      const { usersId } = req.body;
      const deleteJobs = await JobModel.deleteMany({ userId: { $in: usersId } });
      const deleteApplyJobUsers = await applyJobUser.deleteMany({ userId: { $in: usersId } });
      const deleteUserResetPasswords = await userResetPassword.deleteMany({ userId: { $in: usersId } });
      const deleteUserVerifications = await userVerification.deleteMany({ userId: { $in: usersId } });
      const deletedUsers = await user.deleteMany({ _id: { $in: usersId } });

      if (deletedUsers && deleteJobs && deleteApplyJobUsers && deleteUserResetPasswords && deleteUserVerifications) {
        return res.status(200).json({ code: 200, message: "OK", data: deletedUsers });
      } else {
        return res.status(500).json(new HttpException(500, "Server error"));
      }
    } else {
      return res.status(400).json(new HttpException(400, "Bad request"));
    }
  } catch (error) {
    next(error);
  }
};

export const deleteUserById = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json(new HttpException(400, "Bad request"));

    const userFound = await user.findById(userId).lean();
    if (userFound) {
      const deletedUser = await user.findOneAndDelete({ _id: userId });
      if (deletedUser) {
        const users = await user.find().lean();
        return res.status(200).json({ code: 200, message: "OK", data: users });
      } else {
        return res.status(500).json(new HttpException(500, "Server error"));
      }
    } else {
      return res.status(404).json(new HttpException(404, "User not found"));
    }
  } catch (error) {
    next(error);
  }
};

export const getTotalUser = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const total = await user.countDocuments();
    return res.status(200).json({ code: 200, message: "OK", data: total });
  } catch (error) {
    next(error);
  }
};

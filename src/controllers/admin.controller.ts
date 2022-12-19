import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import AdminModel from "@/models/Admin/Admin.model";
import AuthService from "@services/auth.service";
import UserModel from "@/models/User/User.model";
import JobModel from "@/models/Job.model";
import AppliedJobUserModel from "@/models/AppliedJobUser/AppliedJobUser";
import UserResetPasswordModel from "@/models/User/UserResetPassword.model";
import UserVerificationModel from "@/models/User/UserVerification.model";
import UserReportModel from "@/models/User/UserReport.model";
import { IDataStoredInToken, IRequestWithAdmin } from "@/interfaces/auth.interface";
import { HttpException } from "@exceptions/HttpException";

// --------------------------------------------------------------------------------------------

const admin = AdminModel;
const user = UserModel;
const userResetPassword = UserResetPasswordModel;
const userVerification = UserVerificationModel;
const applyJobUser = AppliedJobUserModel;
const reportUser = UserReportModel;

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
    const userFound = await user.findById(userId).exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const bannedUser = await userFound.updateOne({ status: !userFound.status }).exec();

    if (userFound.status === true) {
      const closeJobs = await JobModel.find({ userId }).exec();
      const closeAllJobs = await JobModel.updateMany({ userId }, { isClosed: true }).exec();
      const jobsIdUserBanned = closeJobs.map((job) => job._id);
      const deleteAppliciants = await applyJobUser.deleteMany({ jobId: { $in: jobsIdUserBanned } });
    } else {
      const closeJobs = await JobModel.updateMany({ userId }, { isClosed: false }).exec();
    }

    // const deleteAppliciants = await applyJobUser.deleteMany({ closeJobs. });

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
      const deleteUserReport = await reportUser.deleteMany({ userReportedById: { $in: usersId } } || { userReportedId: { $in: usersId } });
      const deletedUsers = await user.deleteMany({ _id: { $in: usersId } });

      if (deletedUsers && deleteJobs && deleteApplyJobUsers && deleteUserResetPasswords && deleteUserVerifications && deleteUserReport) {
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
      const jobsFounds = await JobModel.find({ userId }).lean();

      if (jobsFounds) {
        const userAppliciants = await applyJobUser.deleteMany({ jobId: { $in: jobsFounds.map((job) => job._id) } });
      }

      const deleteJobs = await JobModel.deleteMany({ userId });
      const deleteApplyJobUsers = await applyJobUser.deleteMany({ userId });
      const deleteUserResetPasswords = await userResetPassword.deleteMany({ userId });
      const deleteUserVerifications = await userVerification.deleteMany({ userId });
      const deleteUserReport = await reportUser.deleteMany({ userReportedById: { $in: userId } } || { userReportedId: { $in: userId } });
      const deletedUser = await user.findOneAndDelete({ _id: userId });
      if (deletedUser && deleteJobs && deleteApplyJobUsers && deleteUserResetPasswords && deleteUserVerifications && deleteUserReport) {
        return res.status(200).json({ code: 200, message: "OK" });
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

export const getReportsUser = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const page: number = parseInt(req.query.page as string) || 0;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const search = req.query.search || "";
    const offset: number = page * limit;

    const resultData = await reportUser.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userReportedId",
          foreignField: "_id",
          as: "userReported",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userReportById",
          foreignField: "_id",
          as: "userReport",
        },
      },
      {
        $unwind: "$userReported",
      },
      {
        $unwind: "$userReport",
      },
      {
        $match: {
          $or: [{ "userReported.email": { $regex: search, $options: "i" } }],
        },
      },
      {
        $project: {
          _id: 1,
          description: 1,
          userReportedId: 1,
          userReportId: 1,
          createdAt: 1,
          userReported: {
            _id: 1,
            email: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
            phoneNumber: 1,
            address: 1,
            status: 1,
            verified: 1,
            createdAt: 1,
          },
          userReport: {
            _id: 1,
            email: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
            phoneNumber: 1,
            address: 1,
            status: 1,
            verified: 1,
            createdAt: 1,
          },
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $skip: offset,
      },
      {
        $limit: limit,
      },
    ]);

    const totalRows = resultData.length;
    const totalPage = Math.ceil(totalRows / limit);

    if (resultData) {
      const total = await reportUser.countDocuments();
      return res
        .status(200)
        .json({ code: 200, message: "OK", data: resultData, ofsset: offset, page, limit, totalRows, totalPage, totalReports: total });
    }

    return res.status(404).json(new HttpException(404, "Reports not found"));
  } catch (error) {
    next(error);
  }
};

export const deleteReportsUser = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    if (req.body) {
      const { reportsId } = req.body;
      const deletedReports = await reportUser.deleteMany({ _id: { $in: reportsId } });

      if (deletedReports) {
        return res.status(200).json({ code: 200, message: "OK", data: deletedReports });
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

export const deleteReportUserById = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    if (!reportId) return res.status(400).json(new HttpException(400, "Bad request"));

    const reportFound = await reportUser.findById(reportId).lean();
    if (reportFound) {
      const deletedReport = await reportUser.findOneAndDelete({ _id: reportId });

      if (deletedReport) {
        const reports = await reportUser.find().lean();
        return res.status(200).json({ code: 200, message: "OK", data: reports });
      }

      return res.status(500).json(new HttpException(500, "Server error"));
    }

    return res.status(404).json(new HttpException(404, "Report not found"));
  } catch (error) {
    next(error);
  }
};

export const getTotalReportUser = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const total = await reportUser.countDocuments();
    return res.status(200).json({ code: 200, message: "OK", data: total });
  } catch (error) {
    next(error);
  }
};

export const getReportUserDetail = async (req: IRequestWithAdmin, res: Response, next: NextFunction) => {
  try {
    const { reportId } = req.params;
    if (!reportId) return res.status(400).json(new HttpException(400, "Bad request"));

    const reportFound = await reportUser.findById(reportId).lean();

    if (reportFound) {
      const report = await reportUser.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userReportedId",
            foreignField: "_id",
            as: "userReported",
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "userReportById",
            foreignField: "_id",
            as: "userReport",
          },
        },
        {
          $unwind: "$userReported",
        },
        {
          $unwind: "$userReport",
        },
        {
          $match: {
            _id: new mongoose.Types.ObjectId(reportId),
          },
        },
        {
          $project: {
            _id: 1,
            description: 1,
            userReportedId: 1,
            userReportId: 1,
            createdAt: 1,
            userReported: {
              _id: 1,
              email: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              phoneNumber: 1,
              address: 1,
              status: 1,
              verified: 1,
              createdAt: 1,
            },
            userReport: {
              _id: 1,
              email: 1,
              username: 1,
              fullName: 1,
              avatar: 1,
              phoneNumber: 1,
              address: 1,
              status: 1,
              verified: 1,
              createdAt: 1,
            },
          },
        },
      ]);

      return res.status(200).json({ code: 200, message: "OK", data: report[0] });
    }

    return res.status(404).json(new HttpException(404, "Report not found"));
  } catch (error) {
    next(error);
  }
};

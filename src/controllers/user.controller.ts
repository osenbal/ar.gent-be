import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "@models/User/User.model";
import UserVerificationModel from "@models/User/UserVerification.model";
import UserResetPasswordModel from "@models/User/UserResetPassword.model";
import AuthService from "@services/auth.service";
import { HttpException } from "@exceptions/HttpException";
import { MailService } from "@services/mail.service";
import { IRequestWithUser } from "@interfaces/auth.interface";
import { IEducation_User, IExperience_User } from "@interfaces/user.interface";
import { ICountry, IState, ICity } from "country-state-city";

const authService = new AuthService();
const mailService = new MailService();
const userResetPassword = UserResetPasswordModel;
const userVerification = UserVerificationModel;
const user = UserModel;

// @desc Create new user
// @route POST /user
// @access Public
export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // create new user
    const newUser = await authService.register(req, res, req.body, req.file?.path);

    if (newUser) {
      const accessToken = authService.createToken(newUser);
      const refreshToken = authService.createRefreshToken(newUser);

      // set cookie auth token
      res.cookie("Authorization", accessToken.token, {
        secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
        httpOnly: true,
        sameSite: "none",
        maxAge: accessToken.expiresIn,
      });

      res.cookie("refreshToken", refreshToken.token, {
        secure: JSON.stringify(process.env.NODE_ENV) === JSON.stringify("developmentBackend") ? false : true,
        httpOnly: true,
        maxAge: refreshToken.expiresIn,
      });

      // send email verification
      return mailService.sendEmailVerification(newUser, res);
    } else {
      return res.status(400).json(new HttpException(400, "Invalid user data received"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc get current user
// @route GET /user/
// @access Private
export const getCurrentUser = (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    return res.status(200).json({ code: 200, message: "OK", data: req.user });
  } catch (error) {
    next(error);
  }
};

// @desc get user by id
// @route GET /user/:id
// @access Public
export const getUserById = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(id).select("-password").lean().exec();

    if (userFound) {
      return res.status(200).json({ code: 200, message: "OK", data: userFound });
    } else {
      return res.status(404).json(new HttpException(404, "User not found"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc edit user profile
// @route PATCH /user/:id
// @access Private
export const userEdit = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(id).exec();

    if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

    // profile information
    userFound.username = req.body.username || userFound.username;
    userFound.fullName = req.body.fullName || userFound.fullName;
    userFound.about = req.body.about || userFound.about;
    userFound.phoneNumber = req.body.phoneNumber || userFound.phoneNumber;
    userFound.gender = req.body.gender || userFound.gender;
    userFound.birthday = req.body.birthday || userFound.birthday;

    // address
    userFound.address.street = req.body.street || userFound.address.street;

    const newCountry: ICountry = req.body.country || userFound.address.country;
    const newState: IState = req.body.state || userFound.address.state;
    const newCity: ICity = req.body.city || userFound.address.city;

    userFound.address.country = newCountry;
    userFound.address.state = newState;
    userFound.address.city = newCity;

    userFound.address.zipCode = req.body.zipCode || userFound.address.zipCode;

    console.log("== req body == ", req.body);

    // portfolio and etc
    if (req.body.portfolioUrl) {
      const newPortfolio: string[] = req.body.portfolioUrl;
      userFound.portfolioUrl = newPortfolio;
    }
    if (req.body.skill) {
      const newSkill: string[] = req.body.skill;
      userFound.skill = newSkill;
    }
    if (req.body.education) {
      const newEducation: IEducation_User[] = req.body.education;
      userFound.education = newEducation;
    }
    if (req.body.experience) {
      const newExperience: IExperience_User[] = req.body.experience;
      userFound.experience = newExperience;
    }

    if (req.body.password) {
      // hash password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      userFound.password = hashedPassword ? hashedPassword : userFound.password;
    }

    if (req.body.email) {
      if (req.body.email === userFound.email) {
        return res.status(400).json(new HttpException(400, "Email already used"));
      }

      // check duplicated email
      const duplicate = await user.findOne({ email: req.body.email }).lean().exec();
      if (duplicate) {
        return res.status(409).json(new HttpException(409, "Email already exists"));
      }

      userFound.email = req.body.email;
    }

    const updatedUser = await userFound.update(userFound).exec();
    console.log("== updated user == ", updatedUser);
    return res.status(200).json({
      code: 200,
      message: `success update profile`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc upload avatar or banner
// @route POST /user/upload/:id/?type=:type
// @access Private
export const uploadImage = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    if (!req.query.type) return res.status(400).json(new HttpException(400, "Bad Request"));

    if (req.query.type === "avatar") {
      const userFound = await user.findById(id).exec();

      if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

      // check form data image

      if (!req.file) {
        return res.status(400).json(new HttpException(400, "Bad Request"));
      }

      const imagePath = req.file.path;

      if (!imagePath) {
        return res.status(400).json(new HttpException(400, "Bad Request"));
      }

      userFound.avatar = req.protocol + "://" + req.get("host") + "/" + imagePath;

      const updatedUser = await userFound.save();

      return res.status(200).json({
        code: 200,
        message: `success update user ${updatedUser.email}`,
        data: updatedUser.avatar,
      });
    } else if (req.query.type === "banner") {
      const userFound = await user.findById(id).exec();

      if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

      if (!req.file) {
        return res.status(400).json(new HttpException(400, "Bad Request"));
      }

      const imagePath = req.file.path;

      if (!imagePath) {
        return res.status(400).json(new HttpException(400, "Bad Request"));
      }

      userFound.banner = req.protocol + "://" + req.get("host") + "/" + imagePath;

      const updatedUser = await userFound.save();

      return res.status(200).json({
        code: 200,
        message: `success update user ${updatedUser.email}`,
        data: updatedUser.banner,
      });
    }

    return res.status(400).json(new HttpException(400, "Bad Request"));
  } catch (error) {
    next(error);
  }
};

export const uploadFile = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    if (!req.query.type) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(id).exec();

    if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

    if (req.query.type === "cv") {
      if (!req.file) {
        return res.status(400).json(new HttpException(400, "Bad Request"));
      }

      const cvPath = req.file.path;

      if (!cvPath) {
        return res.status(400).json(new HttpException(400, "Bad Request"));
      }

      userFound.cv = req.protocol + "://" + req.get("host") + "/" + cvPath;

      const updatedUser = await userFound.save();

      return res.status(200).json({
        code: 200,
        message: `success update user ${updatedUser.email}`,
        data: updatedUser.cv,
      });
    }

    return res.status(400).json(new HttpException(400, "Bad Request"));
  } catch (error) {
    next(error);
  }
};

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(id).exec();

    if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

    if (userFound.verified) {
      return res.status(400).json(new HttpException(400, "User already verified"));
    }

    const userVerify = await userVerification.findOne({ userId: id }).exec();

    if (!userVerify) return res.status(404).json(new HttpException(404, "User verification not found"));

    if (userVerify.expiresAt < new Date()) {
      userVerify.remove();
      return res.status(400).json(new HttpException(400, "Verification code expired"));
    }

    userFound.verified = true;

    const updatedUser = await userFound.save();

    if (updatedUser) {
      userVerify.remove();
      return res.status(200).json({ code: 200, message: "User verified" });
    } else {
      return res.status(500).json(new HttpException(500, "server error"));
    }
  } catch (error) {
    next(error);
  }
};

export const checkVerified = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(id).exec();

    if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

    if (userFound.verified) {
      return res.status(200).json({ code: 200, message: "User verified", data: true });
    } else {
      return res.status(400).json(new HttpException(400, "User not verified"));
    }
  } catch (error) {
    next(error);
  }
};

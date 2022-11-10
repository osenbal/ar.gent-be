import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import UserModel from "@models/User/User.model";
import UserVerificationModel from "@models/User/UserVerification.model";
import UserResetPasswordModel from "@models/User/UserResetPassword.model";
import AuthService from "@services/auth.service";
import { HttpException } from "@exceptions/HttpException";
import { MailService } from "@services/mail.service";
import { CURRENT_URL } from "@config/config";
import { IRequestWithUser } from "@interfaces/auth.interface";
import { IEducation, IExperience } from "@interfaces/user.interface";
import { isEmpty } from "@utils/util";

const authService = new AuthService();
const user = UserModel;
const mailService = new MailService();

// @desc Create new super admin
// @route POST /user/admin-create
// @access Private
export const adminCreate = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { username, fullName, gender, email, password, phoneNumber, birthday, street, city, country, zipCode } = req.body;

    if (req.user.role !== "admin") return res.status(401).json(new HttpException(401, "Unauthorized (not allowed)"));

    // role admin for super admin
    let { role } = req.body;
    role = "admin";
    const verified = true;

    // check if req body is empty
    if (
      !username ||
      !email ||
      !password ||
      !fullName ||
      !gender ||
      !phoneNumber ||
      !role ||
      !birthday ||
      !street ||
      !city ||
      !country ||
      !zipCode ||
      !verified
    ) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    // check duplicated email
    const duplicate = await user.findOne({ email }).lean().exec();
    if (duplicate) {
      return res.status(409).json(new HttpException(409, "Email already exists"));
    }

    if (duplicate.username === username) {
      return res.status(409).json(new HttpException(409, "Username already exists"));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // new admin Object
    const userObject = {
      username,
      fullName,
      phoneNumber,
      gender,
      role,
      email,
      password: hashedPassword,
      birthday: new Date(birthday),
      address: {
        street,
        city,
        country,
        zipCode: Number(zipCode),
      },
      verified,
    };

    // Create new super admin
    const newUser = await user.create(userObject);

    if (newUser) {
      return res.status(201).json({ code: 201, message: "Created", data: newUser });
    } else {
      return res.status(400).json(new HttpException(400, "Invalid user data received"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /user
// @access Public
export const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // create new user
    const newUser = await authService.register(req, req.body, req.file?.path);

    if (newUser) {
      const accessToken = authService.createToken(newUser);
      const refreshToken = authService.createRefreshToken(newUser);

      // set cookie auth token
      res.cookie("Authorization", accessToken.token, {
        httpOnly: true,
        maxAge: accessToken.expiresIn,
      });
      res.cookie("refreshToken", refreshToken.token, {
        httpOnly: true,
        maxAge: refreshToken.expiresIn,
      });

      // send email verification
      return mailService.sendEmailVerification(newUser, res);
      // return res.status(200).json({userId: newUser._id});
    } else {
      return res.status(400).json(new HttpException(400, "Invalid user data received"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc Get all users
// @route GET /user/all
// @access Private
export const getAllUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await user
      .find({ role: ["user"] })
      .select("-password")
      .lean();

    if (!users?.length) {
      return res.status(400).json(new HttpException(400, "No users found"));
    }

    return res.status(200).json({ code: 200, message: "OK", data: users });
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
    userFound.address.city = req.body.city || userFound.address.city;
    userFound.address.state = req.body.state || userFound.address.state;
    userFound.address.country = req.body.country || userFound.address.country;
    userFound.address.zipCode = req.body.zipCode || userFound.address.zipCode;

    console.log("== user address == ", userFound.address);

    // portfolio and etc
    if (req.body.portfolio_url) {
      const newPortfolio: string[] = req.body.portfolio_url;
      userFound.portfolio_url = newPortfolio;
    }
    if (req.body.skill) {
      const newSkill: string[] = req.body.skill;
      userFound.skill = newSkill;
    }
    if (req.body.education) {
      const newEducation: IEducation[] = req.body.education;
      userFound.education = newEducation;
    }
    if (req.body.experience) {
      const newExperience: IExperience[] = req.body.experience;
      userFound.experience = newExperience;
    }

    if (req.body.password) {
      // hash password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
      userFound.password = hashedPassword ? hashedPassword : userFound.password;
    }

    if (req.body.email) {
      if (req.body.email === userFound.email) {
        return res.status(400).json(new HttpException(400, "Email as same"));
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
      message: `success update user ${updatedUser.email}`,
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
    console.log(req.file);
    if (!id) return res.status(400).json(new HttpException(400, "Bad Request"));

    if (!req.query.type) return res.status(400).json(new HttpException(400, "Bad Request"));

    if (req.query.type === "avatar") {
      const userFound = await user.findById(id).exec();

      if (!userFound) return res.status(404).json(new HttpException(404, "User not found"));

      const imagePath = req.file?.path || req.protocol + "://" + req.get("host") + "/" + userFound.avatar;

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

      const imagePath = req.file?.path || req.protocol + "://" + req.get("host") + "/" + userFound.banner;

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

// @desc delete user
// @route DELETE /user/:id
// @access Private
export const userDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (isEmpty(id) || !id) return res.status(400).json(new HttpException(400, "Bad Request"));

    const userFound = await user.findById(id).select("-password").exec();

    if (isEmpty(userFound) || !userFound) return res.status(404).json(new HttpException(404, "User not found"));

    const deletedUser = await userFound.deleteOne();

    return res.status(200).json({
      code: 200,
      message: `User with email ${deletedUser.email} has id ${deletedUser._id} deleted`,
      data: deletedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc Verification user email
// @route GET /user/verify/:userId/:uniqueString
// @access Public
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, uniqueString } = req.params;
    const linkVerified = `${CURRENT_URL}auth/user/verified/`;

    if (!userId || !uniqueString) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const findUserVerification = await UserVerificationModel.find({
      userId,
    }).exec();

    if (findUserVerification.length === 0) {
      return res.render(`pages/404`);
    }

    if (findUserVerification?.length > 0) {
      const { expiresAt } = findUserVerification[0];
      const hashedUniqueString = findUserVerification[0].uniqueString;

      if (expiresAt < new Date()) {
        UserVerificationModel.deleteOne({ userId })
          .then(() => {})
          .catch((err) => {
            return res.render(`pages/404`);
          });
      } else {
        // valid verify
        // compare hashed unique string
        const compareUniqueString: boolean = await bcrypt.compare(uniqueString, hashedUniqueString);

        if (!compareUniqueString) {
          return res.render(`pages/404`);
        }

        // unique string match
        user
          .updateOne({ _id: userId }, { verified: true })
          .then(() => {
            res.redirect(`${linkVerified}${userId}/${uniqueString}`);
          })
          .catch(() => {
            res.render(`pages/404`);
          });
      }
    } else {
      return res.render(`pages/404`);
    }
  } catch (error) {
    next(error);
  }
};

// @desc Success verification page
// @route GET /user/verified/:userId/:uniqueString
// @access Public
export const verifiedUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params;
    const { uniqueString } = req.params;

    if (!userId || !uniqueString) {
      return res.render(`pages/404`);
    }

    const userFound = await user.findById(userId).exec();
    const UserVerificationFound = await UserVerificationModel.find({ userId });

    if (!userFound || !UserVerificationFound) {
      return res.render(`pages/404`);
    }

    // check unique string
    const hashedUniqueString = UserVerificationFound[0]?.uniqueString || "null";
    const compareUniqueString: boolean = await bcrypt.compare(uniqueString, hashedUniqueString);

    if (!compareUniqueString || !userFound.verified || !hashedUniqueString) {
      return res.render(`pages/404`);
    }

    if (userFound.verified && UserVerificationFound.length > 0) {
      UserVerificationModel.deleteOne({ userId })
        .then(() => {
          return res.render(`pages/verifiedUser`);
        })
        .catch((err) => {
          return res.render(`pages/404`);
        });
    } else {
      return res.render(`pages/404`);
    }
  } catch (error) {
    next(error);
  }
};

// @desc Send email verification back
// @route POST /user/send/verification
// @access Public
export const sendVerification = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const userFound = await user.findOne({ email }).lean().exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    if (userFound.verified) {
      return res.status(409).json(new HttpException(409, "User already verified"));
    }

    const userFoundVerification = await UserVerificationModel.find({
      userId: userFound._id,
    });

    userFoundVerification.forEach((item) => {
      item.remove();
    });

    return mailService.sendEmailVerification({ _id: userFound._id, email }, res);
  } catch (error) {
    next(error);
  }
};

// @desc Reset password
// @route POST /user/send/reset-password
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

    if (!userFound.verified) {
      return res.status(409).json(new HttpException(409, "User not verified"));
    }

    const findUserResetPassword = await UserResetPasswordModel.findOne({
      userId: userFound._id,
    });

    if (findUserResetPassword || findUserResetPassword?.expiresAt > new Date()) {
      findUserResetPassword.remove();
    }

    // send email reset password
    return mailService.sendEmailResetPassword({ _id: userFound._id, email }, res);
  } catch (error) {
    next(error);
  }
};

// @desc Reset password
// @route POST /user/reset/password/:userId/:uniqueString
// @access Private
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, uniqueString } = req.params;
    const { password } = req.body;

    if (!userId || !uniqueString || !password) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const userFound = await user.findById(userId).exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    if (!userFound.verified) {
      return res.status(409).json(new HttpException(409, "User not verified"));
    }

    const findUserResetPassword = await UserResetPasswordModel.findOne({
      userId: userFound._id,
    });

    if (!findUserResetPassword) {
      return res.status(404).json(new HttpException(404, "Invalid Link or Expired"));
    }

    const hashedUniqueString = findUserResetPassword.uniqueString;
    const compareUniqueString: boolean = await bcrypt.compare(uniqueString, hashedUniqueString);

    if (!compareUniqueString) {
      return res.status(404).json(new HttpException(404, "Invalid Link or Expired"));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user
      .updateOne({ _id: userId }, { password: hashedPassword })
      .then(() => {
        findUserResetPassword.remove();
        return res.status(200).json(new HttpException(200, "Password success updated"));
      })
      .catch(() => {
        return res.status(500).json(new HttpException(500, "Internal Server Error"));
      });
  } catch (error) {
    next(error);
  }
};

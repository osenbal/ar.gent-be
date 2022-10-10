import UserModel from '@/models/User/User.model';
import UserVerificationModel from '@/models/User/UserVerification.model';
import bcrypt from 'bcrypt';
import UserResetPasswordModel from '@models/User/UserResetPassword.model';
import { NextFunction, Request, Response } from 'express';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';
import { IRequestWithUser } from '@interfaces/auth.interface';
import { MailService } from '@services/mail.service';
import { CURRENT_URL } from '@config/config';
import { ROLE_USER } from '@config/constant/constant';
import { IAddress, IEducation, IExperience } from '@interfaces/user.interface';

const user = UserModel;
const mailService = new MailService();

// @desc Create new super admin
// @route POST /auth/user/admin-create
// @access Private
const adminCreate = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      username,
      fullName,
      gender,
      email,
      password,
      phoneNumber,
      birthday,
      street,
      city,
      country,
      zipCode,
    } = req.body;

    if (req.user.role !== 'admin')
      return res
        .status(401)
        .json(new HttpException(401, 'Unauthorized (not allowed)'));

    // role admin for super admin
    let { role } = req.body;
    role = 'admin';
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
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    // check duplicated email
    const duplicate = await user.findOne({ email }).lean().exec();
    if (duplicate) {
      return res
        .status(409)
        .json(new HttpException(409, 'Email already exists'));
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
        zipCode,
      },
      verified,
    };

    // Create new super admin
    const newUser = await user.create(userObject);

    if (newUser) {
      return res
        .status(201)
        .json({ code: 201, message: 'Created', data: newUser });
    } else {
      return res
        .status(400)
        .json(new HttpException(400, 'Invalid user data received'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /auth/user/signup
// @access Public
const signUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      username,
      fullName,
      gender,
      email,
      password,
      phoneNumber,
      birthday,
      street,
      city,
      country,
      zipCode,
    } = req.body;

    let { role } = req.body;

    // Get path photo upload from request
    const image = req.file.path;

    // role user for normal user
    if (!isEmpty(role) || role === '') {
      role = ROLE_USER;
    }

    // check if req body is empty
    if (
      !username ||
      !email ||
      !password ||
      !fullName ||
      !gender ||
      !phoneNumber ||
      !image ||
      !birthday ||
      !street ||
      !city ||
      !country ||
      !zipCode
    ) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    // check duplicated email
    const duplicate = await user.findOne({ email }).lean().exec();
    if (duplicate) {
      return res
        .status(409)
        .json(new HttpException(409, 'Email already exists'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const addressUser: IAddress = {
      street,
      city,
      country,
      zipCode,
    };
    // new user Object
    const userObject = {
      username,
      fullName,
      phoneNumber,
      gender,
      email,
      password: hashedPassword,
      avatar: image,
      birthday,
      address: addressUser,
    };

    // Create new user
    const newUser = await user.create(userObject);
    if (newUser) {
      return mailService.sendEmailVerification(newUser, res);
    } else {
      return res
        .status(400)
        .json(new HttpException(400, 'Invalid user data received'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /auth/user/all
// @access Public
const getAllUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await user
      .find({ role: ['user'] })
      .select('-password')
      .lean();

    if (!users?.length) {
      return res.status(400).json(new HttpException(400, 'No users found'));
    }

    return res.status(200).json({ code: 200, message: 'OK', data: users });
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /auth/user/:id
// @access Public
const getUserById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json(new HttpException(400, 'Bad Request'));

    const userFound = await user.findById(id).select('-password').lean().exec();

    if (userFound) {
      return res.status(200).json({ code: 200, message: 'OK', data: user });
    } else {
      return res.status(404).json(new HttpException(404, 'User not found'));
    }
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /auth/user/edit/:id
// @access Private
const userEdit = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) return res.status(400).json(new HttpException(400, 'Bad Request'));

    const userFound = await user.findById(id).exec();

    if (!userFound)
      return res.status(404).json(new HttpException(404, 'User not found'));

    // profile information
    userFound.username = req.body.username || userFound.username;
    userFound.fullName = req.body.lastName || userFound.fullName;
    userFound.about = req.body.about || userFound.about;
    userFound.phoneNumber = req.body.phoneNumber || userFound.phoneNumber;
    userFound.gender = req.body.gender || userFound.gender;
    userFound.birthday = req.body.birthday || userFound.birthday;

    // address
    userFound.address.street = req.body.street || userFound.address.street;
    userFound.address.city = req.body.city || userFound.address.city;
    userFound.address.country = req.body.country || userFound.address.country;
    userFound.address.zipCode = req.body.zipCode || userFound.address.zipCode;

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
        return res.status(400).json(new HttpException(400, 'Email as same'));
      }

      // check duplicated email
      const duplicate = await user
        .findOne({ email: req.body.email })
        .lean()
        .exec();
      if (duplicate) {
        return res
          .status(409)
          .json(new HttpException(409, 'Email already exists'));
      }
    }

    const updatedUser = await userFound.save();
    return res.status(200).json({
      code: 200,
      message: `success update user ${updatedUser.email}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc upload avatar or banner
// @route POST /auth/user/upload/:id/?type=:type
// @access Private
const uploadImage = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.query.type)
      return res.status(400).json(new HttpException(400, 'Bad Request'));

    if (req.query.type === 'avatar') {
      const { id } = req.params;
      if (!id)
        return res.status(400).json(new HttpException(400, 'Bad Request'));

      const userFound = await user.findById(id).exec();

      if (!userFound)
        return res.status(404).json(new HttpException(404, 'User not found'));

      const image = req.file?.path;
      console.log(req.file);

      if (!image) {
        return res.status(400).json(new HttpException(400, 'Bad Request'));
      }

      userFound.avatar = image;
      const updatedUser = await userFound.save();

      return res.status(200).json({
        code: 200,
        message: `success update user ${updatedUser.email}`,
      });
    } else if (req.query.type === 'banner') {
      const { id } = req.params;
      if (!id)
        return res.status(400).json(new HttpException(400, 'Bad Request'));

      const userFound = await user.findById(id).exec();

      if (!userFound)
        return res.status(404).json(new HttpException(404, 'User not found'));

      const image = req.file?.path;

      if (!image) {
        return res.status(400).json(new HttpException(400, 'Bad Request'));
      }

      userFound.banner = image;
      const updatedUser = await userFound.save();

      return res.status(200).json({
        code: 200,
        message: `success update user ${updatedUser.email}`,
      });
    }

    return res.status(400).json(new HttpException(400, 'Bad Request'));
  } catch (error) {
    next(error);
  }
};

// @desc Create new user
// @route POST /auth/user/delete/:id
// @access Private
const userDelete = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (isEmpty(id) || !id)
      return res.status(400).json(new HttpException(400, 'Bad Request'));

    const userFound = await user.findById(id).select('-password').exec();

    if (isEmpty(userFound) || !userFound)
      return res.status(404).json(new HttpException(404, 'User not found'));

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
// @route POST /auth/user/verify/:userId/:uniqueString
// @access Public
const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId, uniqueString } = req.params;
    const linkVerified = `${CURRENT_URL}auth/user/verified/`;

    if (!userId || !uniqueString) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    const findUserVerification = await UserVerificationModel.find({
      userId,
    }).exec();

    console.log(findUserVerification);

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
        const compareUniqueString: boolean = await bcrypt.compare(
          uniqueString,
          hashedUniqueString
        );

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
// @route POST /auth/user/verified/:userId
// @access Public
const verifiedUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    const hashedUniqueString = UserVerificationFound[0]?.uniqueString || 'null';
    const compareUniqueString: boolean = await bcrypt.compare(
      uniqueString,
      hashedUniqueString
    );

    if (!compareUniqueString || !userFound.verified || !hashedUniqueString) {
      return res.render(`pages/404`);
    }

    if (userFound.verified && UserVerificationFound.length > 0) {
      console.log('verified');
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
// @route POST /auth/user/send/verification
// @access Public
const sendVerification = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    const userFound = await user.findOne({ email }).lean().exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, 'User not found'));
    }

    if (userFound.verified) {
      return res
        .status(409)
        .json(new HttpException(409, 'User already verified'));
    }

    const userFoundVerification = await UserVerificationModel.find({
      userId: userFound._id,
    });

    userFoundVerification.forEach((item) => {
      item.remove();
    });

    return mailService.sendEmailVerification(
      { _id: userFound._id, email },
      res
    );
  } catch (error) {
    next(error);
  }
};

// @desc Reset password
// @route POST /auth/user/send/reset-password
// @access Public
const requestResetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    const userFound = await user.findOne({ email }).exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, 'User not found'));
    }

    if (!userFound.verified) {
      return res.status(409).json(new HttpException(409, 'User not verified'));
    }

    const findUserResetPassword = await UserResetPasswordModel.findOne({
      userId: userFound._id,
    });

    if (
      findUserResetPassword ||
      findUserResetPassword?.expiresAt > new Date()
    ) {
      findUserResetPassword.remove();
    }

    // send email reset password
    return mailService.sendEmailResetPassword(
      { _id: userFound._id, email },
      res
    );
  } catch (error) {
    next(error);
  }
};

// @desc Reset password
// @route POST /auth/user/reset/password/:userId/:uniqueString
// @access Private
const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, uniqueString } = req.params;
    const { password } = req.body;

    if (!userId || !uniqueString || !password) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    const userFound = await user.findById(userId).exec();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, 'User not found'));
    }

    if (!userFound.verified) {
      return res.status(409).json(new HttpException(409, 'User not verified'));
    }

    const findUserResetPassword = await UserResetPasswordModel.findOne({
      userId: userFound._id,
    });

    if (!findUserResetPassword) {
      return res
        .status(404)
        .json(new HttpException(404, 'Invalid Link or Expired'));
    }

    const hashedUniqueString = findUserResetPassword.uniqueString;
    const compareUniqueString: boolean = await bcrypt.compare(
      uniqueString,
      hashedUniqueString
    );

    if (!compareUniqueString) {
      return res
        .status(404)
        .json(new HttpException(404, 'Invalid Link or Expired'));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user
      .updateOne({ _id: userId }, { password: hashedPassword })
      .then(() => {
        findUserResetPassword.remove();
        return res
          .status(200)
          .json(new HttpException(200, 'Password success updated'));
      })
      .catch(() => {
        return res
          .status(500)
          .json(new HttpException(500, 'Internal Server Error'));
      });
  } catch (error) {
    next(error);
  }
};

export {
  signUp,
  getAllUser,
  getUserById,
  userEdit,
  userDelete,
  adminCreate,
  verifyUser,
  verifiedUser,
  sendVerification,
  requestResetPassword,
  resetPassword,
  uploadImage,
};

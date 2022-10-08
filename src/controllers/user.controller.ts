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
      firstName,
      lastName,
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
      !firstName ||
      !email ||
      !password ||
      !lastName ||
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
      firstName,
      lastName,
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
      firstName,
      lastName,
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
      !firstName ||
      !email ||
      !password ||
      !lastName ||
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

    // new user Object
    const userObject = {
      firstName,
      lastName,
      phoneNumber,
      gender,
      email,
      password: hashedPassword,
      photo: image,
      birthday,
      address: {
        street,
        city,
        country,
        zipCode,
      },
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
const userEdit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, gender, phoneNumber, email, password } =
      req.body;
    console.log('req : ', req.body);

    if (!id) return res.status(400).json(new HttpException(400, 'Bad Request'));

    const userFound = await user.findById(id).exec();

    if (!userFound)
      return res.status(404).json(new HttpException(404, 'User not found'));

    const duplicate = await user.findOne({ email }).lean().exec();

    if (duplicate && duplicate._id.toString() !== id) {
      return res
        .status(409)
        .json(new HttpException(409, 'Email already exists'));
    }

    userFound.firstName = firstName ? firstName : userFound.firstName;
    userFound.lastName = lastName ? lastName : userFound.lastName;
    userFound.gender = gender ? gender : userFound.gender;
    userFound.phoneNumber = phoneNumber ? phoneNumber : userFound.phoneNumber;
    userFound.email = email ? email : userFound.email;

    if (password) {
      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      userFound.password = hashedPassword ? hashedPassword : userFound.password;
    }

    const updatedUser = await userFound.save();

    return res.status(200).json({
      code: 200,
      message: `success update user ${updatedUser.email}`,
      data: updatedUser,
    });
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
    });

    if (!findUserVerification) {
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
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, _id } = req.body;

    if (!email || !_id) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    const findUser = await user.findOne({ _id }).lean().exec();

    if (!findUser) {
      return res.status(404).json(new HttpException(404, 'User not found'));
    }

    if (findUser.verified) {
      return res
        .status(409)
        .json(new HttpException(409, 'User already verified'));
    }

    const findUserVerification = await UserVerificationModel.find({
      _id,
    });

    findUserVerification.forEach((item) => {
      item.remove();
    });

    return mailService.sendEmailVerification({ _id, email }, res);
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
};

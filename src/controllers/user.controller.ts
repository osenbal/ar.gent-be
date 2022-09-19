import { NextFunction, Request, Response } from 'express';
import UserModel from '@models/User.model';
import bcrypt from 'bcrypt';
import { HttpException } from '@exceptions/HttpException';
import { isEmpty } from '@utils/util';
import { RequestWithUser } from '@/interfaces/auth.interface';

const user = UserModel;

const adminCreate = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { firstName, lastName, gender, email, password, phoneNumber } = req.body;

    if (req.user.role !== 'admin') return res.status(401).json(new HttpException(401, 'Unauthorized (not allowed)'));

    let { role } = req.body;

    role = 'admin';

    if (!firstName || !email || !password || !lastName || !gender || !phoneNumber || !role) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    // check duplicated email
    const duplicate = await user.findOne({ email }).lean().exec();

    if (duplicate) {
      res.status(409).json(new HttpException(409, 'Email already exists'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userObject = { firstName, lastName, phoneNumber, gender, role, email, password: hashedPassword };

    const newUser = await user.create(userObject);

    if (newUser) {
      return res.status(201).json({ code: 201, message: 'Created', data: newUser });
    } else {
      return res.status(400).json(new HttpException(400, 'Invalid user data received'));
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
    const { firstName, lastName, gender, email, password, phoneNumber } = req.body;
    let { role } = req.body;

    if (!isEmpty(role) || role === '') {
      role = 'user';
    }

    if (!firstName || !email || !password || !lastName || !gender || !phoneNumber) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    // check duplicated email
    const duplicate = await user.findOne({ email }).lean().exec();

    if (duplicate) {
      res.status(409).json(new HttpException(409, 'Email already exists'));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const userObject = { firstName, lastName, phoneNumber, gender, email, password: hashedPassword };

    const newUser = await user.create(userObject);

    if (newUser) {
      return res.status(201).json({ code: 201, message: 'Created', data: newUser });
    } else {
      return res.status(400).json(new HttpException(400, 'Invalid user data received'));
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
      .find({ roles: ['user'] })
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
    const { firstName, lastName, gender, description, phoneNumber, active, email, password } = req.body;

    if (!id) return res.status(400).json(new HttpException(400, 'Bad Request'));

    const userFound = await user.findById(id).exec();

    if (!userFound) return res.status(404).json(new HttpException(404, 'User not found'));

    const duplicate = await user.findOne({ email }).lean().exec();

    if (duplicate && duplicate._id !== id) {
      return res.status(409).json(new HttpException(409, 'Email already exists'));
    }

    userFound.firstName = firstName ? firstName : userFound.firstName;
    userFound.lastName = lastName ? lastName : userFound.lastName;
    userFound.gender = gender ? gender : userFound.gender;
    userFound.description = description ? description : userFound.description;
    userFound.phoneNumber = phoneNumber ? phoneNumber : userFound.phoneNumber;
    userFound.active = active ? active : userFound.active;
    userFound.email = email ? email : userFound.email;

    if (password) {
      // hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      userFound.password = hashedPassword ? hashedPassword : userFound.password;
    }

    const updatedUser = await userFound.save();

    return res.status(200).json({ code: 200, message: `success update user ${updatedUser.email}`, data: updatedUser });
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

    if (isEmpty(id) || !id) return res.status(400).json(new HttpException(400, 'Bad Request'));

    const userFound = await user.findById(id).select('-password').exec();

    if (isEmpty(userFound) || !userFound) return res.status(404).json(new HttpException(404, 'User not found'));

    const deletedUser = await userFound.deleteOne();

    return res.status(200).json({ code: 200, message: `User with email ${deletedUser.email} has id ${deletedUser._id} deleted`, data: deletedUser });
  } catch (error) {
    next(error);
  }
};

export { signUp, getAllUser, getUserById, userEdit, userDelete, adminCreate };

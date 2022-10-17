import UserModel from "@/models/User/User.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "@config/config";
import IUser, { IAddress, IUserRegister } from "@interfaces/user.interface";
import { ITokenData, IDataStoredInToken } from "@interfaces/auth.interface";
import { isEmpty } from "@utils/util";
import { HttpException } from "@/exceptions/HttpException";
import { Request } from "express";

class AuthService {
  public user = UserModel;

  public async register(req, newUser, avatar) {
    if (isEmpty(newUser)) throw new HttpException(400, "Bad request");
    if (isEmpty(avatar)) throw new HttpException(400, "Bad request");

    const { username, fullName, gender, email, password, phoneNumber, birthday, street, city, country, zipCode } = newUser;

    if (
      !username ||
      !email ||
      !password ||
      !fullName ||
      !gender ||
      !phoneNumber ||
      !avatar ||
      !birthday ||
      !street ||
      !city ||
      !country ||
      !zipCode
    ) {
      throw new HttpException(400, "Bad request");
    }

    const findUser = await this.user
      .findOne({
        email: newUser.email,
      })
      .lean()
      .exec();

    if (findUser) throw new HttpException(409, `This email ${newUser.email} already exists`);

    const duplicateUsername = await this.user.findOne({ username: newUser.username }).lean().exec();

    if (duplicateUsername) {
      throw new HttpException(409, `This username ${newUser.username} already exists`);
    }

    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    const addressUser: IAddress = {
      street: newUser.street,
      city: newUser.city,
      country: newUser.country,
      zipCode: newUser.zipCode,
    };

    const newUserObject: IUserRegister = {
      avatar: req.protocol + "://" + req.get("host") + "/" + avatar,
      username: newUser.username,
      fullName: newUser.fullName,
      phoneNumber: newUser.phoneNumber,
      gender: newUser.gender,
      birthday: new Date(newUser.birthday),
      address: addressUser,
      email: newUser.email,
      password: hashedPassword,
    };

    const createUserData: IUser = await this.user.create(newUserObject);

    return createUserData;
  }

  public async login(userData): Promise<{ refreshTokenData: ITokenData; accessToken: ITokenData }> {
    if (isEmpty(userData)) throw new HttpException(400, "Unauthorized");

    const foundUser: IUser = await this.user.findOne({ email: userData.email }).exec();
    if (!foundUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await bcrypt.compare(userData.password, foundUser.password);
    if (!isPasswordMatching) throw new HttpException(409, "Password is not matching");

    const accessToken = this.createToken(foundUser);
    const refreshTokenData = this.createRefreshToken(foundUser);

    return { refreshTokenData, accessToken };
  }

  public async refresh(refreshToken: string): Promise<{ refreshTokenData: ITokenData; accessToken: ITokenData }> {
    if (!refreshToken) throw new HttpException(400, "Unauthorized");

    const secretKey: string = REFRESH_TOKEN_SECRET;
    const { _id } = jwt.verify(refreshToken, secretKey) as IDataStoredInToken;

    const user = await this.user.findById(_id).exec();
    if (!user) throw new HttpException(409, "User not found");

    const accessToken: ITokenData = this.createToken(user);
    const refreshTokenData: ITokenData = this.createRefreshToken(user);

    return { refreshTokenData, accessToken };
  }

  public async logout(userData: IUser): Promise<IUser> {
    if (isEmpty(userData)) throw new HttpException(400, "userData is empty");

    const foundUser: IUser = await this.user.findOne({ email: userData.email });

    if (!foundUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    return foundUser;
  }

  public createToken(userData: IUser): ITokenData {
    const dataStoredInToken: IDataStoredInToken = {
      _id: userData._id.toString(),
      role: userData.role,
    };

    const secretKey: string = ACCESS_TOKEN_SECRET;

    const expiresIn: number = 1000 * 60 * 60; // an hour

    return {
      expiresIn: expiresIn,
      token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createRefreshToken(user: IUser): ITokenData {
    const dataStoredInToken: IDataStoredInToken = {
      _id: user._id.toString(),
      role: user.role,
    };

    const secretKey: string = REFRESH_TOKEN_SECRET;

    const expiresIn: number = 1000 * 60 * 60 * 24 * 7; // a week

    return {
      expiresIn: expiresIn,
      token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createCookie(accessToken: ITokenData): string {
    return `Authorization=${accessToken.token}; HttpOnly; secure; Max-Age=${accessToken.expiresIn};`;
  }
}

export default AuthService;

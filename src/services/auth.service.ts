import UserModel from "@/models/User/User.model";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { MailService } from "./mail.service";
import AdminModel from "@/models/Admin/Admin.model";
import IUser, { IRegister_User } from "@interfaces/user.interface";
import IAdmin from "@/interfaces/admin.interface";
import { ITokenData, IDataStoredInToken } from "@interfaces/auth.interface";
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from "@config/config";
import { HttpException } from "@/exceptions/HttpException";
import { isEmpty } from "@utils/util";

// ----------------------------------------------------------------------------------------------

class AuthService {
  // --- Attribute ---
  private user = UserModel;
  private admin = AdminModel;
  private mailService = new MailService();

  // ------ Public Method for user ---------------
  public async register(req, res, newUser, avatar) {
    if (isEmpty(newUser)) throw new HttpException(400, "Bad request");
    if (isEmpty(avatar)) throw new HttpException(400, "Bad request");

    const { username, fullName, gender, email, password, phoneNumber, birthday } = newUser;

    if (!username || !email || !password || !fullName || !gender || !phoneNumber || !avatar || !birthday) {
      throw new HttpException(400, "Bad request");
    }

    // check email exist
    const findUser = await this.user
      .findOne({
        email: newUser.email,
      })
      .lean()
      .exec();
    if (findUser) throw new HttpException(409, `This email ${newUser.email} already exists`);

    // check username exist
    const duplicateUsername = await this.user.findOne({ username: newUser.username }).lean().exec();
    if (duplicateUsername) {
      throw new HttpException(409, `This username ${newUser.username} already exists`);
    }

    // password regex check
    const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
    if (!PASSWORD_REGEX.test(password)) {
      throw new HttpException(400, `password not valid`);
    }

    // hash password
    const hashedPassword = await bcrypt.hash(newUser.password, 10);

    // create new user
    const objNewUser: IRegister_User = {
      avatar: req.protocol + "://" + req.get("host") + "/" + avatar,
      username: newUser.username,
      fullName: newUser.fullName,
      phoneNumber: newUser.phoneNumber,
      gender: newUser.gender,
      birthday: new Date(newUser.birthday),
      email: newUser.email,
      password: hashedPassword,
    };
    const newUserObject = new this.user(objNewUser);
    newUserObject.save((err) => {
      if (err) return res.status(500).json(new HttpException(500, "Internal server error"));
    });

    return newUserObject;
  }

  public async login(userData): Promise<{ refreshTokenData: ITokenData; accessToken: ITokenData; userId: string }> {
    if (isEmpty(userData)) throw new HttpException(400, "Unauthorized");

    const foundUser: IUser = await this.user.findOne({ email: userData.email }).exec();
    if (!foundUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await bcrypt.compare(userData.password, foundUser.password);
    if (!isPasswordMatching) throw new HttpException(409, "Sorry, Password wrong");

    if (!foundUser.status) throw new HttpException(409, `Account has been banned`);

    const accessToken = this.createToken(foundUser);
    const refreshTokenData = this.createRefreshToken(foundUser);

    return { refreshTokenData, accessToken, userId: foundUser._id.toString() };
  }

  public async refresh(refreshToken: string): Promise<{ refreshTokenData: ITokenData; accessToken: ITokenData }> {
    if (!refreshToken) throw new HttpException(400, "Unauthorized");

    const secretKey: string = REFRESH_TOKEN_SECRET;
    const { _id } = jwt.verify(refreshToken, secretKey) as IDataStoredInToken;

    if (!_id) throw new HttpException(400, "Unauthorized");

    const user = await this.user.findById(_id).exec();
    if (!user) throw new HttpException(409, "User not found");

    if (!user.status) throw new HttpException(409, `Account has been banned`);

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

  public verifyAccessToken(token: string): IDataStoredInToken {
    const secretKey: string = ACCESS_TOKEN_SECRET;
    return jwt.verify(token, secretKey) as IDataStoredInToken;
  }

  // ---- Admin auth service ---------------
  public createTokenAdmin(admin: IAdmin): ITokenData {
    const dataStoredInToken: IDataStoredInToken = {
      _id: admin._id.toString(),
    };

    const secretKey: string = ACCESS_TOKEN_SECRET;

    const expiresIn: number = 1000 * 60 * 60; // one hour

    return {
      expiresIn: expiresIn,
      token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createRefreshTokenAdmin(admin: IAdmin): ITokenData {
    const dataStoredInToken: IDataStoredInToken = {
      _id: admin._id.toString(),
    };

    const secretKey: string = REFRESH_TOKEN_SECRET;

    const expiresIn: number = 1000 * 60 * 60 * 24; // one day

    return {
      expiresIn: expiresIn,
      token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public async loginAdmin(adminData): Promise<{ refreshTokenData: ITokenData; accessToken: ITokenData; adminId: string }> {
    if (isEmpty(adminData)) throw new HttpException(400, "Unauthorized");

    const foundAdmin: IAdmin = await this.admin.findOne({ email: adminData.email }).lean();

    if (!foundAdmin) throw new HttpException(409, `This email ${adminData.email} was not found`);

    const isPasswordMatching: boolean = await bcrypt.compare(adminData.password, foundAdmin.password);

    if (!isPasswordMatching) throw new HttpException(409, "Sorry, Password wrong");

    const accessToken = this.createTokenAdmin(foundAdmin);
    const refreshTokenData = this.createRefreshTokenAdmin(foundAdmin);

    return { refreshTokenData, accessToken, adminId: foundAdmin._id.toString() };
  }

  public async refreshAdmin(refreshToken: string): Promise<{ refreshTokenData: ITokenData; accessToken: ITokenData }> {
    if (!refreshToken) throw new HttpException(400, "Unauthorized");

    const secretKey: string = REFRESH_TOKEN_SECRET;
    const { _id } = jwt.verify(refreshToken, secretKey) as IDataStoredInToken;

    if (!_id) throw new HttpException(400, "Unauthorized");

    const admin = await this.admin.findById(_id).exec();
    if (!admin) throw new HttpException(409, "User not found");

    const accessToken: ITokenData = this.createTokenAdmin(admin);
    const refreshTokenData: ITokenData = this.createRefreshTokenAdmin(admin);

    return { refreshTokenData, accessToken };
  }

  public verifyAccessTokenAdmin(token: string): IDataStoredInToken {
    const secretKey: string = ACCESS_TOKEN_SECRET;
    return jwt.verify(token, secretKey) as IDataStoredInToken;
  }
}

export default AuthService;

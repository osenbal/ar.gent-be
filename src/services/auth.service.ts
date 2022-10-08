import UserModel from '@/models/User/User.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '@config/config';
import IUser from '@interfaces/user.interface';
import { ITokenData, IDataStoredInToken } from '@interfaces/auth.interface';
import { isEmpty } from '@utils/util';
import { HttpException } from '@/exceptions/HttpException';

class AuthService {
  public user = UserModel;

  public async login(
    userData
  ): Promise<{ refreshITokenData: ITokenData; accessToken: ITokenData }> {
    if (isEmpty(userData)) throw new HttpException(400, 'Unauthorized');

    const foundUser: IUser = await this.user
      .findOne({ email: userData.email })
      .exec();
    if (!foundUser)
      throw new HttpException(
        409,
        `This email ${userData.email} was not found`
      );

    const isPasswordMatching: boolean = await bcrypt.compare(
      userData.password,
      foundUser.password
    );
    if (!isPasswordMatching)
      throw new HttpException(409, 'Password is not matching');

    const accessToken = this.createToken(foundUser);
    const refreshITokenData = this.createRefreshToken(foundUser);

    return { refreshITokenData, accessToken };
  }

  public async refresh(
    refreshToken: string
  ): Promise<{ refreshITokenData: ITokenData; accessToken: ITokenData }> {
    if (!refreshToken) throw new HttpException(400, 'Unauthorized');

    const secretKey: string = REFRESH_TOKEN_SECRET;
    const { _id } = jwt.verify(refreshToken, secretKey) as IDataStoredInToken;

    const user = await this.user.findById(_id).exec();
    if (!user) throw new HttpException(409, 'User not found');

    const accessToken: ITokenData = this.createToken(user);
    const refreshITokenData: ITokenData = this.createRefreshToken(user);

    return { refreshITokenData, accessToken };
  }

  public async logout(userData: IUser): Promise<IUser> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const foundUser: IUser = await this.user.findOne({ email: userData.email });

    if (!foundUser)
      throw new HttpException(
        409,
        `This email ${userData.email} was not found`
      );

    return foundUser;
  }

  public createToken(user: IUser): ITokenData {
    const IdataStoredInToken: IDataStoredInToken = {
      _id: user._id.toString(),
      role: user.role,
    };

    const secretKey: string = ACCESS_TOKEN_SECRET;

    const expiresIn: number = 60 * 60; // an hour

    return {
      expiresIn: expiresIn,
      token: jwt.sign(IdataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createRefreshToken(user: IUser): ITokenData {
    const IdataStoredInToken: IDataStoredInToken = {
      _id: user._id.toString(),
      role: user.role,
    };

    const secretKey: string = REFRESH_TOKEN_SECRET;

    const expiresIn: number = 60 * 60 * 24 * 7; // a week

    return {
      expiresIn: expiresIn,
      token: jwt.sign(IdataStoredInToken, secretKey, { expiresIn }),
    };
  }

  public createCookie(refreshToken: ITokenData): string {
    return `Authorization=${refreshToken.token}; HttpOnly; secure; Max-Age=${refreshToken.expiresIn};`;
  }
}

export default AuthService;

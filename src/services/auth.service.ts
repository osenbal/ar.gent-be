import UserModel from '@models/User.model';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } from '@config/config';
import { User } from '@interfaces/user.interface';
import { TokenData, DataStoredInToken } from '@/interfaces/auth.interface';
import { isEmpty } from '@utils/util';
import { HttpException } from '@/exceptions/HttpException';

class AuthService {
  public user = UserModel;

  public async login(userData): Promise<{ refreshTokenData: TokenData; accessToken: TokenData }> {
    if (isEmpty(userData)) throw new HttpException(400, 'Unauthorized');

    const foundUser: User = await this.user.findOne({ email: userData.email }).exec();
    if (!foundUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    const isPasswordMatching: boolean = await bcrypt.compare(userData.password, foundUser.password);
    if (!isPasswordMatching) throw new HttpException(409, 'Password is not matching');

    const accessToken = this.createToken(foundUser);
    const refreshTokenData = this.createRefreshToken(foundUser);

    return { refreshTokenData, accessToken };
  }

  public async refresh(refreshToken: string): Promise<{ refreshTokenData: TokenData; accessToken: TokenData }> {
    if (!refreshToken) throw new HttpException(400, 'Unauthorized');

    const secretKey: string = REFRESH_TOKEN_SECRET;
    const { _id } = jwt.verify(refreshToken, secretKey) as DataStoredInToken;

    const user = await this.user.findById(_id).exec();
    if (!user) throw new HttpException(409, 'User not found');

    const accessToken: TokenData = this.createToken(user);
    const refreshTokenData: TokenData = this.createRefreshToken(user);

    return { refreshTokenData, accessToken };
  }

  public async logout(userData: User): Promise<User> {
    if (isEmpty(userData)) throw new HttpException(400, 'userData is empty');

    const foundUser: User = await this.user.findOne({ email: userData.email });

    if (!foundUser) throw new HttpException(409, `This email ${userData.email} was not found`);

    return foundUser;
  }

  public createToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { _id: user._id, roles: user.roles };

    const secretKey: string = ACCESS_TOKEN_SECRET;

    const expiresIn: number = 60 * 60; // an hour

    return { expiresIn: expiresIn, token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createRefreshToken(user: User): TokenData {
    const dataStoredInToken: DataStoredInToken = { _id: user._id, roles: user.roles };

    const secretKey: string = REFRESH_TOKEN_SECRET;

    const expiresIn: number = 60 * 60 * 24 * 7; // a week

    return { expiresIn: expiresIn, token: jwt.sign(dataStoredInToken, secretKey, { expiresIn }) };
  }

  public createCookie(refreshToken: TokenData): string {
    return `Authorization=${refreshToken.token}; HttpOnly; secure; Max-Age=${refreshToken.expiresIn};`;
  }
}

export default AuthService;

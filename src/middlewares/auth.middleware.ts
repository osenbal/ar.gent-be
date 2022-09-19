import { verify } from 'jsonwebtoken';
import UserModel from '@/models/User.model';
import { DataStoredInToken } from '@interfaces/auth.interface';
import { Response, NextFunction } from 'express';
import { RequestWithUser } from '@interfaces/auth.interface';
import { HttpException } from '@exceptions/HttpException';
import { ACCESS_TOKEN_SECRET } from '@config/config';

const authMiddleware = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    const Authorization = req.header('Authorization') ? req.header('Authorization').split('Bearer ')[1] : null;

    if (Authorization) {
      const secretKey: string = ACCESS_TOKEN_SECRET;
      const verificationResponse = (await verify(Authorization, secretKey)) as DataStoredInToken;
      const userId = verificationResponse._id;
      const findUser = await UserModel.findById(userId).lean().exec();

      if (findUser) {
        req.user = findUser;
        next();
      } else {
        next(new HttpException(401, 'Unauthorized'));
      }
    } else {
      next(new HttpException(404, 'Authentication token missing'));
    }
  } catch (error) {
    next(new HttpException(401, 'Wrong authentication token'));
  }
};

export default authMiddleware;

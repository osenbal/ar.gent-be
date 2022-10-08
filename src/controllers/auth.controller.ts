import { Request, Response, NextFunction } from 'express';
import AuthService from '@services/auth.service';
import { HttpException } from '@exceptions/HttpException';
import { RequestWithUser } from '@interfaces/auth.interface';

//  @desc initialized object AuthService
const authService = new AuthService();

// @desc Login user
// @route POST /auth/login
// @access Public
const logIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;
    const { refreshTokenData, accessToken } = await authService.login(userData);

    res.cookie('Authorization', refreshTokenData.token, {
      httpOnly: true,
      // secure: true,
      sameSite: 'none',
      maxAge: refreshTokenData.expiresIn,
    });

    res.status(200).json({ code: 200, message: 'OK', data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

// @desc Refresh
// @route POST /auth/refresh
// @access Private - because access token has expired
const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.Authorization) {
      return res.status(401).json(new HttpException(401, 'Unauthorized'));
    }

    const refreshToken = cookies.Authorization;

    const { refreshTokenData, accessToken } = await authService.refresh(
      refreshToken
    );

    res.cookie('Authorization', refreshTokenData.token, {
      httpOnly: true,
      // secure: true,
      sameSite: 'none',
      maxAge: refreshTokenData.expiresIn,
    });

    res.status(200).json({ code: 200, message: 'OK', data: { accessToken } });
  } catch (error) {
    next(error);
  }
};

// @desc logout
// @route POST /auth/logout
// @access Private - just to clear cookie if exist
const logout = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction
) => {
  try {
    const cookies = req.cookies;
    if (!cookies?.Authorization)
      return res.status(204).json({ code: 204, message: 'No Content' });

    res.clearCookie('Authorization', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.status(200).json({ code: 200, message: 'Cookie Cleared' });
  } catch (error) {
    next(error);
  }
};

export { logIn, refresh, logout };

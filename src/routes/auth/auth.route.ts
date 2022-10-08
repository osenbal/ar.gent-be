import { Router } from 'express';
import limiterMiddleware from '@/middlewares/limiter.midleware';
import authMiddleware from '@middlewares/auth.middleware';
import { logIn, logout, refresh } from '@controllers/auth.controller';
import { Routes } from '@interfaces/routes.interface';

class AuthRoute implements Routes {
  public path = '/auth/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router
      .route(`${this.path}login`)
      .post(
        limiterMiddleware(
          'Too many login attempts, please try again after 1 minute',
          5,
          60 * 1000
        ),
        logIn
      );

    this.router.route(`${this.path}refresh`).get(refresh);

    this.router.route(`${this.path}logout`).post(authMiddleware, logout);
  }
}

export default AuthRoute;

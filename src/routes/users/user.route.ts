import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import limiterMiddleware from '@middlewares/limiter.midleware';
import authMiddleware from '@middlewares/auth.middleware';
import uploadStorage, { filterImage } from '@middlewares/storage.middleware';
import {
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
} from '@controllers/user.controller';
import {
  authPolicyMiddleware,
  authRoleAndPolicyMiddleware,
  authRoleMiddleware,
} from '@middlewares/authRole.middleware';
import multer from 'multer';

class UserRoute implements Routes {
  public path = '/auth/user/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router
      .route(`${this.path}admin-create`)
      .post(authMiddleware, authRoleMiddleware('admin'), adminCreate);

    this.router
      .route(`${this.path}signup`)
      .post(uploadStorage('profile', filterImage).single('image'), signUp);

    this.router.route(`${this.path}send/verification`).get(sendVerification);

    this.router
      .route(`${this.path}verify/:userId/:uniqueString`)
      .get(verifyUser);

    this.router
      .route(`${this.path}verified/:userId/:uniqueString`)
      .get(verifiedUser);

    this.router
      .route(`${this.path}all`)
      .get(authMiddleware, authRoleMiddleware('admin'), getAllUser);

    this.router.route(`${this.path}:id`).get(getUserById);

    this.router
      .route(`${this.path}edit/:id`)
      .patch(authMiddleware, authPolicyMiddleware, userEdit);

    this.router
      .route(`${this.path}updateProfile/:id`)
      .patch((req, res, next) => {
        res.send('updateProfile');
      });

    this.router
      .route(`${this.path}delete/:id`)
      .delete(authMiddleware, authRoleAndPolicyMiddleware('admin'), userDelete);

    this.router
      .route(`${this.path}send/reset-password`)
      .post(requestResetPassword);

    this.router
      .route(`${this.path}reset/password/:userId/:uniqueString`)
      .post(resetPassword);
  }
}

export default UserRoute;

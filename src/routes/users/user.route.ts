import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import limiterMiddleware from '@middlewares/limiter.midleware';

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
} from '@controllers/user.controller';
import {
  authPolicyMiddleware,
  authRoleAndPolicyMiddleware,
  authRoleMiddleware,
} from '@middlewares/authRole.middleware';
import authMiddleware from '@middlewares/auth.middleware';
import uploadStorage, { filterImage } from '@middlewares/storage.middleware';

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
      .post(uploadStorage('profile', 'image', filterImage), signUp);

    this.router
      .route(`${this.path}send/verification`)
      .get(
        limiterMiddleware('send email verification limited', 1, 60 * 1000),
        sendVerification
      );

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
      .route(`${this.path}delete/:id`)
      .delete(authMiddleware, authRoleAndPolicyMiddleware('admin'), userDelete);

    this.router.route(`${this.path}reset/:id`).delete((req, res) => {
      res.send('reset');
    });
  }
}

export default UserRoute;

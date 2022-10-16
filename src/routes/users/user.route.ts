import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
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
  uploadImage,
  getCurrentUser,
  getUserSummary,
  getCurrentUserDetail,
} from '@controllers/user.controller';
import {
  authPolicyMiddleware,
  authRoleAndPolicyMiddleware,
  authRoleMiddleware,
} from '@middlewares/authRole.middleware';

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
      .post(uploadStorage('profile', filterImage).single('avatar'), signUp);

    this.router.route(`${this.path}`).get(authMiddleware, getCurrentUser);

    this.router
      .route(`${this.path}verify-token`)
      .get(authMiddleware, getUserSummary);

    this.router.route(`${this.path}detail`).get(getCurrentUserDetail);

    this.router
      .route(`${this.path}all`)
      .get(authMiddleware, authRoleMiddleware('admin'), getAllUser);

    this.router.route(`${this.path}:id`).get(getUserById);

    this.router
      .route(`${this.path}edit/:id`)
      .patch(authMiddleware, authPolicyMiddleware, userEdit);

    this.router
      .route(`${this.path}upload/:id`)
      .put(
        authMiddleware,
        authPolicyMiddleware,
        uploadStorage('profile', filterImage).single('image'),
        uploadImage
      );

    this.router
      .route(`${this.path}delete/:id`)
      .delete(authMiddleware, authRoleAndPolicyMiddleware('admin'), userDelete);

    // email verification
    this.router
      .route(`${this.path}send/verification`)
      .get(authMiddleware, authPolicyMiddleware, sendVerification);

    this.router
      .route(`${this.path}verify/:userId/:uniqueString`)
      .get(verifyUser);

    this.router
      .route(`${this.path}verified/:userId/:uniqueString`)
      .get(verifiedUser);

    // password reset
    this.router
      .route(`${this.path}send/reset-password`)
      .post(requestResetPassword);

    this.router
      .route(`${this.path}reset/password/:userId/:uniqueString`)
      .post(resetPassword);
  }
}

export default UserRoute;

import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { signUp, getAllUser, getUserById, userEdit, userDelete, adminCreate } from '@controllers/user.controller';
import { authPolicyMiddleware, authRoleAndPolicyMiddleware, authRoleMiddleware } from '@middlewares/authRole.middleware';
import authMiddleware from '@middlewares/auth.middleware';

class UserRoute implements Routes {
  public path = '/auth/user/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}admin-create`).post(authMiddleware, authRoleMiddleware('admin'), adminCreate);

    this.router.route(`${this.path}signup`).post(signUp);

    this.router.route(`${this.path}all`).get(authMiddleware, authRoleMiddleware('admin'), getAllUser);

    this.router.route(`${this.path}:id`).get(getUserById);

    this.router.route(`${this.path}edit/:id`).patch(authMiddleware, authPolicyMiddleware, userEdit);

    this.router.route(`${this.path}delete/:id`).delete(authMiddleware, authRoleAndPolicyMiddleware('admin'), userDelete);
  }
}

export default UserRoute;

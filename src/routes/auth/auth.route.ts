import { Router } from "express";
import authMiddleware from "@middlewares/auth.middleware";
import { checkUniqueStringResetPassword, logIn, logout, refresh, requestResetPassword, resetPassword } from "@controllers/auth.controller";
import { Routes } from "@interfaces/routes.interface";
// import limiterMiddleware from "@/middlewares/limiter.midleware";

class AuthRoute implements Routes {
  public path = "/auth/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}login`).post(logIn);

    this.router.route(`${this.path}refresh`).get(refresh);

    this.router.route(`${this.path}logout`).post(logout);

    this.router.route(`${this.path}reset-password`).post(requestResetPassword);

    this.router.route(`${this.path}reset-password/:uniqueString`).post(resetPassword);
    this.router.route(`${this.path}reset-password/check/:uniqueString`).get(checkUniqueStringResetPassword);

    // this.router.route(`${this.path}page/reset-password/:uniqueString`).post(resetPassword);
  }
}

export default AuthRoute;

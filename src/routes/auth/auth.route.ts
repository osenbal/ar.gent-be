import { Router } from "express";
import authMiddleware from "@middlewares/auth.middleware";
import { logIn, logout, refresh } from "@controllers/auth.controller";
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
  }
}

export default AuthRoute;

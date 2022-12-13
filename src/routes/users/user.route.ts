import { Router } from "express";
import * as userController from "@controllers/user.controller";
import authMiddleware from "@/middlewares/User/auth.middleware";
import uploadStorage, { filterImage, filterPdf } from "@middlewares/User/storage.middleware";
import { authPolicyMiddleware } from "@/middlewares/User/authPolicy.middleware";
import limiterMiddleware from "@/middlewares/limiter.midleware";
import { Routes } from "@interfaces/routes.interface";

class UserRoute implements Routes {
  public path = "/user/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}`).post(uploadStorage("profile/avatar", filterImage).single("avatar"), userController.signUp);

    this.router.route(`${this.path}`).get(authMiddleware, userController.getCurrentUser);

    this.router.route(`${this.path}:userId`).get(authMiddleware, userController.getUserById);

    this.router.route(`${this.path}:id`).patch(authMiddleware, authPolicyMiddleware, userController.userEdit);

    this.router
      .route(`${this.path}upload/:id`)
      .put(authMiddleware, authPolicyMiddleware, uploadStorage("profile/avatar", filterImage).single("image"), userController.uploadImage);

    this.router
      .route(`${this.path}uploadfile/:id`)
      .put(authMiddleware, authPolicyMiddleware, uploadStorage("profile/cv", filterPdf).single("cv"), userController.uploadFile);

    this.router
      .route(`${this.path}send-verify/:id`)
      .post(
        authMiddleware,
        authPolicyMiddleware,
        limiterMiddleware("to many request please wait for 15 minutes", 5, 1000 * 60 * 15),
        userController.sendVerifyCode
      );

    this.router.route(`${this.path}verify/:id`).get(userController.verifyUser);

    this.router.route(`${this.path}report/:userId`).post(authMiddleware, userController.reportUser);
  }
}

export default UserRoute;

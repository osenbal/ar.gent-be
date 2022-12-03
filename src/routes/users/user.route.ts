import { Router } from "express";
import { Routes } from "@interfaces/routes.interface";
import authMiddleware from "@middlewares/auth.middleware";
import uploadStorage, { filterImage, filterPdf } from "@middlewares/storage.middleware";
import * as userController from "@controllers/user.controller";
import { authPolicyMiddleware } from "@middlewares/authRole.middleware";

class UserRoute implements Routes {
  public path = "/user/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}`).post(uploadStorage("profile", filterImage).single("avatar"), userController.signUp);

    this.router.route(`${this.path}`).get(authMiddleware, userController.getCurrentUser);

    this.router.route(`${this.path}:id`).get(authMiddleware, userController.getUserById);

    this.router.route(`${this.path}:id`).patch(authMiddleware, authPolicyMiddleware, userController.userEdit);

    this.router
      .route(`${this.path}upload/:id`)
      .put(authMiddleware, authPolicyMiddleware, uploadStorage("profile/avatar", filterImage).single("image"), userController.uploadImage);

    this.router
      .route(`${this.path}uploadfile/:id`)
      .put(authMiddleware, authPolicyMiddleware, uploadStorage("profile/cv", filterPdf).single("cv"), userController.uploadFile);

    this.router.route(`${this.path}verify/:id`).get(userController.verifyUser);

    this.router.route(`${this.path}check-verify/:id`).get(userController.checkVerified);

    // this.router.route(`${this.path}send/reset-password`).post(userController.requestResetPassword);

    // this.router.route(`${this.path}reset/password/:userId/:uniqueString`).post(userController.resetPassword);

    // this.router.route(`${this.path}:id`).delete(authMiddleware, userController.userDelete);

    // this.router.route(`${this.path}all`).get(authMiddleware,userController.getAllUser);

    // this.router.route(`${this.path}send/verification`).get(authMiddleware, authPolicyMiddleware, userController.sendVerification);

    // this.router.route(`${this.path}verify/:userId/:uniqueString`).get(userController.verifyUser);

    // this.router.route(`${this.path}verified/:userId/:uniqueString`).get(userController.verifiedUser);
  }
}

export default UserRoute;

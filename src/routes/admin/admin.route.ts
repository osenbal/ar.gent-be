import { Router } from "express";
import { Routes } from "@interfaces/routes.interface";
import {
  bannedUser,
  createNewAdmin,
  deleteUserById,
  deleteUsers,
  getAllUser,
  getCurrentAdmin,
  getTotalUser,
  loginAdmin,
  logoutAdmin,
  refreshTokenAdmin,
} from "@controllers/admin.controller";
import authAdminMiddleware from "@/middlewares/Admin/authAdmin.middleware";

class AdminRoute implements Routes {
  public path = "/admin/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // auth
    this.router.route(`${this.path}`).post(createNewAdmin);

    this.router.route(`${this.path}refresh`).get(refreshTokenAdmin);

    this.router.route(`${this.path}login`).post(loginAdmin);

    this.router.route(`${this.path}logout`).post(logoutAdmin);

    // user
    this.router.route(`${this.path}get/users/total`).get(authAdminMiddleware, getTotalUser);

    this.router.route(`${this.path}get/users`).get(authAdminMiddleware, getAllUser);

    this.router.route(`${this.path}banned/:userId`).patch(authAdminMiddleware, bannedUser);

    this.router.route(`${this.path}delete/users`).delete(authAdminMiddleware, deleteUsers);

    this.router.route(`${this.path}delete/user/:userId`).delete(authAdminMiddleware, deleteUserById);

    this.router.route(`${this.path}:adminId`).get(authAdminMiddleware, getCurrentAdmin);
  }
}

export default AdminRoute;

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
  getReportsUser,
  deleteReportsUser,
  getTotalReportUser,
  deleteReportUserById,
  getReportUserDetail,
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
    this.router.route(`${this.path}user`).get(authAdminMiddleware, getAllUser);
    this.router.route(`${this.path}user/total`).get(authAdminMiddleware, getTotalUser);
    this.router.route(`${this.path}user/delete`).delete(authAdminMiddleware, deleteUsers);
    this.router.route(`${this.path}user/banned/:userId`).patch(authAdminMiddleware, bannedUser);

    this.router.route(`${this.path}user/report`).get(authAdminMiddleware, getReportsUser);
    this.router.route(`${this.path}user/report/total`).get(authAdminMiddleware, getTotalReportUser);
    this.router.route(`${this.path}user/report/delete`).delete(authAdminMiddleware, deleteReportsUser);
    this.router.route(`${this.path}user/report/:reportId`).get(authAdminMiddleware, getReportUserDetail);
    this.router.route(`${this.path}user/report/:reportId`).delete(authAdminMiddleware, deleteReportUserById);

    this.router.route(`${this.path}user/:userId`).delete(authAdminMiddleware, deleteUserById);

    this.router.route(`${this.path}:adminId`).get(authAdminMiddleware, getCurrentAdmin);

    // report user
  }
}

export default AdminRoute;

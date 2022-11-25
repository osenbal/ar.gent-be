import { Router } from "express";
import { Routes } from "@interfaces/routes.interface";
import {
  createJob,
  getAllJob,
  getJobByUserId,
  getJobById,
  updateJob,
  deleteJobById,
  handleApplyJob,
  checkIsApplied,
} from "@controllers/job.controller";
import { authPolicyMiddleware, authRoleAndPolicyMiddleware, authRoleMiddleware } from "@middlewares/authRole.middleware";
import authMiddleware from "@middlewares/auth.middleware";

class JobRoute implements Routes {
  public path = "/job/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}`).get(authMiddleware, getAllJob);
    this.router.route(`${this.path}`).post(authMiddleware, createJob);

    this.router.route(`${this.path}id/:jobId`).get(getJobById);

    this.router.route(`${this.path}:userId`).get(authMiddleware, getJobByUserId);

    this.router.route(`${this.path}:jobId`).patch(authMiddleware, updateJob);

    this.router.route(`${this.path}:jobId`).delete(authMiddleware, deleteJobById);

    this.router.route(`${this.path}apply/:jobId`).post(authMiddleware, handleApplyJob);

    this.router.route(`${this.path}check-apply/:jobId`).get(authMiddleware, checkIsApplied);
  }
}

export default JobRoute;

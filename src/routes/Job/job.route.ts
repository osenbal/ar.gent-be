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
  getAppliciants,
  handleApproveJob,
  handleRejectJob,
  getApplicationsUser,
  getNearlyJobs,
} from "@controllers/job.controller";
import { authPolicyMiddleware } from "@middlewares/authRole.middleware";
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

    this.router.route(`${this.path}nearly`).get(authMiddleware, getNearlyJobs);

    this.router.route(`${this.path}:jobId`).get(authMiddleware, getJobById);

    this.router.route(`${this.path}user/:userId`).get(authMiddleware, getJobByUserId);

    this.router.route(`${this.path}:jobId`).patch(authMiddleware, updateJob);

    this.router.route(`${this.path}:jobId`).delete(authMiddleware, deleteJobById);

    this.router.route(`${this.path}:jobId/appliciants`).get(authMiddleware, getAppliciants);

    this.router.route(`${this.path}apply/:jobId`).post(authMiddleware, handleApplyJob);

    this.router.route(`${this.path}check-apply/:jobId`).get(authMiddleware, checkIsApplied);

    this.router.route(`${this.path}approve/:id/:userId/:jobId`).post(authMiddleware, authPolicyMiddleware, handleApproveJob);

    this.router.route(`${this.path}reject/:id/:userId/:jobId`).post(authMiddleware, authPolicyMiddleware, handleRejectJob);

    this.router.route(`${this.path}applications/:userId`).get(authMiddleware, getApplicationsUser);
  }
}

export default JobRoute;

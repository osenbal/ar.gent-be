import { Router } from "express";
import {
  createNewJob,
  getJobs,
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
import { authPolicyMiddleware } from "@/middlewares/User/authPolicy.middleware";
import authMiddleware from "@/middlewares/User/auth.middleware";
import { Routes } from "@interfaces/routes.interface";

class JobRoute implements Routes {
  public path = "/job/";
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}`).post(authMiddleware, createNewJob);

    this.router.route(`${this.path}`).get(authMiddleware, getJobs);

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

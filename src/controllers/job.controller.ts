import { Request, Response, NextFunction } from "express";
import JobModel from "@models/Job.model";
import UserModel from "@/models/User/User.model";
import AppliedJobUserModel from "@/models/AppliedJobUser/AppliedJobUser";
import { HttpException } from "@/exceptions/HttpException";
import { IRequestWithUser } from "@/interfaces/auth.interface";
import IUser from "@/interfaces/user.interface";
import mongoose from "mongoose";
import { City, ICity, ICountry, IState } from "country-state-city";
import { EJobLevel, EJobType, EJobWorkPlace, IAddress, ICreateBody, INewJob } from "@/interfaces/job.interface";

const job = JobModel;
const user = UserModel;
const applyJobUser = AppliedJobUserModel;

export const createJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { title, description, type, level, workPlace, city, country, state, salary }: ICreateBody = req.body;

    const userId = req.user._id;

    if (!title || !description || !type || !level || !workPlace || !city || !country || !state || !salary || !userId) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const userFound = await user.findById(userId).lean();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const location: IAddress = {
      country,
      state,
      city,
    };

    const jobObject: INewJob = {
      userId,
      username: userFound.username,
      title,
      description,
      type,
      level,
      location,
      workPlace,
      salary,
    };

    const newJob = await job.create(jobObject);

    if (newJob) {
      return res.status(201).json({ code: 201, message: "Created", data: newJob });
    } else {
      return res.status(400).json(new HttpException(400, "Invalid job data received"));
    }
  } catch (error) {
    next(error);
  }
};

export const getAllJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (req.query.page && req.query.limit) {
      const { page, limit } = req.query;

      const jobs = await job
        .find()
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit))
        .lean();

      if (jobs) {
        const total = await job.countDocuments();
        return res.status(200).json({ code: 200, message: "OK", data: jobs, total });
      } else {
        return res.status(404).json(new HttpException(404, "No job found"));
      }
    } else {
      const jobs = await job.find().lean();

      if (jobs) {
        return res.status(200).json({ code: 200, message: "OK", data: jobs });
      } else {
        return res.status(404).json(new HttpException(404, "No job found"));
      }
    }
  } catch (error) {
    next(error);
  }
};

export const getJobByUserId = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;
    const jobs = await job.find({ userId }).lean();
    return res.status(200).json({ code: 200, message: "OK", data: jobs });
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;
    const dataUser: IUser = await user.findOne({ _id: userId }).lean();

    return res.status(200).json({ code: 200, message: "OK", data: { ...jobFound, avatarUser: dataUser.avatar } });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const jobFound = await job.findOne({ _id: jobId }).exec();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;

    if (userId.toString() !== req.user._id.toString()) {
      return res.status(401).json(new HttpException(401, "Unauthorized"));
    }

    // const { title, description, type, level, workPlace, city, country, state, salary }: ICreateBody = req.body;

    const country: ICountry = req.body.country || jobFound.location.country;
    const state: IState = req.body.state || jobFound.location.state;
    const city: ICity = req.body.city || jobFound.location.city;

    const type: EJobType = req.body.type || jobFound.type;
    const level: EJobLevel = req.body.level || jobFound.level;
    const workPlace: EJobWorkPlace = req.body.workPlace || jobFound.workPlace;

    jobFound.title = req.body.title || jobFound.title;
    jobFound.description = req.body.description || jobFound.description;
    jobFound.type = type || jobFound.type;
    jobFound.level = level || jobFound.level;
    jobFound.workPlace = workPlace || jobFound.workPlace;
    jobFound.location = {
      country,
      state,
      city,
    };

    const updatedJob = await jobFound.updateOne(jobFound).exec();

    if (updatedJob) {
      return res.status(200).json({ code: 200, message: "OK", data: "success update" });
    }
  } catch (error) {
    next(error);
  }
};

export const deleteJobById = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;
    if (userId.toString() !== req.user._id.toString()) {
      return res.status(401).json(new HttpException(401, "Unauthorized tet"));
    }

    const deletedJob = await job.findOne({ _id: jobId }).deleteOne();

    if (deletedJob) {
      return res.status(200).json({ code: 200, message: "OK", data: "success delete" });
    }
  } catch (error) {
    next(error);
  }
};

export const handleApplyJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;
    if (userId.toString() === req.user._id.toString()) {
      return res.status(401).json(new HttpException(401, "Unauthorized"));
    }

    const userData = await user.findOne({ _id: req.user._id }).lean();

    if (userData) {
      if (userData.cv === "" || !userData.cv) {
        return res.status(400).json({
          code: 400,
          message: "Please upload your CV",
          data: {
            cv: userData.cv,
            isExist: false,
          },
        });
      }
    }

    const userApply = await applyJobUser.findOne({ userId: req.user._id, jobId }).lean();

    if (userApply) {
      if (userApply.isApprove === "approved") {
        return res.status(400).json(new HttpException(400, "You have already approved in this job"));
      }

      if (userApply.isApprove === "rejected") {
        return res.status(400).json(new HttpException(400, "You have already rejected in this job"));
      }

      const deletedApplyJob = await applyJobUser.findOne({ userId: req.user._id, jobId }).deleteOne();

      if (deletedApplyJob) {
        return res.status(200).json({ code: 200, message: "success unapply", data: false });
      } else {
        return res.status(500).json(new HttpException(500, "Server error"));
      }
    }

    const applyObject = { userId: req.user._id, jobId, isApprove: "pending" };

    const newApply = await applyJobUser.create(applyObject);

    if (newApply) {
      return res.status(201).json({ code: 201, message: "applied job", data: "pending" });
    } else {
      return res.status(400).json(new HttpException(400, "Invalid apply data received"));
    }
  } catch (error) {
    next(error);
  }
};

export const checkIsApplied = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;

    if (userId.toString() === req.user._id.toString()) {
      return res.status(401).json(new HttpException(401, "Unauthorized"));
    }

    const applyJobs = await applyJobUser.findOne({ userId: req.user._id, jobId }).lean();

    if (applyJobs) {
      if (applyJobs.isApprove === "approved") {
        return res.status(200).json({ code: 200, message: "OK", data: "approved" });
      }

      if (applyJobs.isApprove === "rejected") {
        return res.status(200).json({ code: 200, message: "OK", data: "rejected" });
      }

      return res.status(200).json({ code: 200, message: "applied", data: "pending" });
    }

    return res.status(200).json({ code: 200, message: "OK", data: false });
  } catch (error) {
    next(error);
  }
};

export const getAppliciants = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    let paneQuery = req.query.pane;

    if (paneQuery === "null" || paneQuery === "undefined") {
      paneQuery = "pending";
    }

    if (paneQuery !== "pending" && paneQuery !== "approved" && paneQuery !== "rejected") {
      return res.status(400).json(new HttpException(400, "Invalid pane query"));
    }

    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;

    if (userId.toString() !== req.user._id.toString()) {
      return res.status(401).json(new HttpException(401, "Unauthorized"));
    }

    const applyJobs = await applyJobUser.find({ jobId }).lean();

    if (applyJobs.length >= 1) {
      const usersApplyInJob = await applyJobUser.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $match: {
            jobId: new mongoose.Types.ObjectId(jobId),
            isApprove: paneQuery,
          },
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            jobId: 1,
            isApprove: 1,
            "user._id": 1,
            "user.username": 1,
            "user.fullName": 1,
            "user.email": 1,
            "user.cv": 1,
            "user.avatar": 1,
            "user.createdAt": 1,
          },
        },
      ]);

      return res.status(200).json({ code: 200, message: "OK", data: usersApplyInJob });
    }

    return res.status(200).json({ code: 200, message: "OK", data: [] });
  } catch (error) {
    next(error);
  }
};

export const handleApproveJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const userIdAppliciant = req.params.userId;

    if (!jobId || !userIdAppliciant) {
      return res.status(400).json(new HttpException(400, "Invalid data received"));
    }

    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const userFound = await user.findOne({ _id: userIdAppliciant }).lean();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const appliciant = await applyJobUser.findOne({ jobId, userId: userIdAppliciant }).lean();

    if (!appliciant) {
      return res.status(404).json(new HttpException(404, "Appliciant not found"));
    }

    if (appliciant.isApprove === "approved") {
      return res.status(400).json(new HttpException(400, "Appliciant already approved"));
    }

    const updatedAppliciant = await applyJobUser.findOneAndUpdate({ jobId, userId: userIdAppliciant }, { isApprove: "approved" }, { new: true });

    if (updatedAppliciant) {
      return res.status(200).json({ code: 200, message: `${userFound.username} has approved`, data: updatedAppliciant });
    } else {
      return res.status(500).json(new HttpException(500, "Server error"));
    }
  } catch (error) {
    next(error);
  }
};

export const handleRejectJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const userIdAppliciant = req.params.userId;

    if (!jobId || !userIdAppliciant) {
      return res.status(400).json(new HttpException(400, "Invalid data received"));
    }

    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const userFound = await user.findOne({ _id: userIdAppliciant }).lean();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const appliciant = await applyJobUser.findOne({ jobId, userId: userIdAppliciant }).lean();

    if (!appliciant) {
      return res.status(404).json(new HttpException(404, "Appliciant not found"));
    }

    if (appliciant.isApprove === "rejected") {
      return res.status(400).json(new HttpException(400, "Appliciant already rejected"));
    }

    const updatedAppliciant = await applyJobUser.findOneAndUpdate({ jobId, userId: userIdAppliciant }, { isApprove: "rejected" }, { new: true });

    if (updatedAppliciant) {
      return res.status(200).json({ code: 200, message: `${userFound.username} has rejected`, data: updatedAppliciant });
    }

    return res.status(500).json(new HttpException(500, "Server error"));
  } catch (error) {
    next(error);
  }
};

export const getApplicationsUser = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const userFound = await user.findById(userId).lean();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User Not Found"));
    }

    const userApplications = await applyJobUser.find({ userId }).lean().exec();

    if (!userApplications) {
      return res.status(200).json({ code: 200, message: "OK", data: [] });
    }

    const JobJoinUserAppliciants = await applyJobUser.aggregate([
      {
        $lookup: {
          from: "jobs",
          localField: "jobId",
          foreignField: "_id",
          as: "job",
        },
      },
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          jobId: 1,
          isApprove: 1,
          createdAt: 1,
          "job._id": 1,
          "job.title": 1,
          "job.location": 1,
        },
      },
    ]);

    if (JobJoinUserAppliciants) {
      return res.status(200).json({ code: 200, message: "OK", data: JobJoinUserAppliciants });
    }
  } catch (error) {
    next(error);
  }
};

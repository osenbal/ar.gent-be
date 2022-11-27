import { Request, Response, NextFunction } from "express";
import JobModel from "@models/Job.model";
import UserModel from "@/models/User/User.model";
import AppliedJobUserModel from "@/models/AppliedJobUser/AppliedJobUser";
import { HttpException } from "@/exceptions/HttpException";
import { IRequestWithUser } from "@/interfaces/auth.interface";
import IUser from "@/interfaces/user.interface";

const job = JobModel;
const user = UserModel;
const applyJobUser = AppliedJobUserModel;

export const createJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const { title, description, type, level, workPlace, location, salary } = req.body;

    const userId = req.user._id;

    if (!title || !description || !type || !level || !workPlace || !location || !salary || !userId) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const userFound = await user.findById(userId).lean();

    if (!userFound) {
      return res.status(404).json(new HttpException(404, "User not found"));
    }

    const jobObject = {
      userId,
      username: userFound.username,
      title,
      description,
      type,
      level,
      workPlace,
      location,
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
    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }
    const { userId } = jobFound;
    if (userId.toString() !== req.user._id.toString()) {
      return res.status(401).json(new HttpException(401, "Unauthorized"));
    }

    const { title, description, type, level, workPlace, location, salary } = req.body;

    const jobObject = {
      title,
      description,
      type,
      level,
      workPlace,
      location,
      salary,
    };

    const updatedJob = await job.findOne({ _id: jobId }).updateOne(jobObject);

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
      if (userApply.isApprove) {
        return res.status(400).json(new HttpException(400, "You have already approved in this job"));
      }

      const deletedApplyJob = await applyJobUser.findOne({ userId: req.user._id, jobId }).deleteOne();
      if (deletedApplyJob) {
        return res.status(200).json({ code: 200, message: "success unapply", data: false });
      } else {
        return res.status(500).json(new HttpException(500, "Server error"));
      }
    }
    const applyObject = { userId: req.user._id, jobId };

    const newApply = await applyJobUser.create(applyObject);

    if (newApply) {
      return res.status(201).json({ code: 201, message: "applied job", data: true });
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
    // if (userId.toString() === req.user._id.toString()) {
    //   return res.status(401).json(new HttpException(401, "Unauthorized"));
    // }

    const applyJobs = await applyJobUser.find({ userId: req.user._id, jobId }).lean();

    if (applyJobs.length >= 1) {
      return res.status(200).json({ code: 200, message: "applied", data: true });
    }

    return res.status(200).json({ code: 200, message: "not applied", data: false });
  } catch (error) {
    next(error);
  }
};

export const getAppliciants = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
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
      const listUserId = applyJobs.map((item) => item.userId);
      const usersData = await user.find({ _id: { $in: listUserId } });

      return res.status(200).json({ code: 200, message: "OK", data: usersData });
    }

    return res.status(200).json({ code: 200, message: "OK", data: [] });
  } catch (error) {
    next(error);
  }
};

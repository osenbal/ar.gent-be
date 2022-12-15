import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { ICity, ICountry, IState } from "country-state-city";
import { MailService } from "@/services/mail.service";
import JobModel from "@models/Job.model";
import UserModel from "@/models/User/User.model";
import AppliedJobUserModel from "@/models/AppliedJobUser/AppliedJobUser";
import { IRequestWithUser } from "@/interfaces/auth.interface";
import IUser from "@/interfaces/user.interface";
import { EJobLevel, EJobType, EJobWorkPlace, IAddress, ICreateBody, INewJob } from "@/interfaces/job.interface";
import { HttpException } from "@/exceptions/HttpException";

// -----------------------------------------------------
// Model
// -----------------------------------------------------
const job = JobModel;
const user = UserModel;
const applyJobUser = AppliedJobUserModel;

// -----------------------------------------------------
// Services
// -----------------------------------------------------
const mailService = new MailService();

// -----------------------------------------------------

// @desc Create new job
// @route POST /job
// @access Private
export const createNewJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
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

// @desc Get all jobs
// @route GET /job
// @access Public
export const getJobs = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const optionTypes = Object.values(EJobType).map((value: string) => value);
    const optionLevels = Object.values(EJobLevel).map((value: string) => value);
    const optionWorkPlace = Object.values(EJobWorkPlace).map((value: string) => value);

    // =====================================================
    // Query string
    // =====================================================
    const search: string = (req.query.search as string) || "";
    let startIndex: number = parseInt(req.query.startIndex as string) || 0;
    // multiple 10
    let isTrueOffset = false;
    if (startIndex % 10 === 0) {
      isTrueOffset = true;
    }

    if (!isTrueOffset) {
      startIndex = 0;
    }

    let workplace: string = (req.query.workplace as string) || "";
    let type: string = (req.query.type as string) || "";
    let level: string = (req.query.level as string) || "";
    if (workplace && !optionWorkPlace.includes(workplace)) {
      workplace = "";
    }
    if (type && !optionTypes.includes(type)) {
      type = "";
    }
    if (level && !optionLevels.includes(level)) {
      level = "";
    }

    // =====================================================
    // Pagination
    // =====================================================
    const page: number = parseInt(req.query.page as string) || 0;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const offset: number = startIndex !== 0 ? startIndex : page * limit;
    const totalRows = await job
      .countDocuments({
        $and: [
          { title: { $regex: search, $options: "i" } },
          {
            workPlace: { $regex: workplace, $options: "i" },
            type: { $regex: type, $options: "i" },
            level: { $regex: level, $options: "i" },
          },
        ],
      })
      .exec();
    const totalPage = Math.ceil(totalRows / limit);

    const result = await job
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $match: {
            $and: [
              { title: { $regex: search, $options: "i" } },
              { workPlace: { $regex: workplace, $options: "i" }, type: { $regex: type, $options: "i" }, level: { $regex: level, $options: "i" } },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            location: 1,
            salary: 1,
            createdAt: 1,
            user: {
              _id: 1,
              username: 1,
              fullName: 1,
            },
          },
        },
      ])
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    if (!result) {
      return res.status(200).json({ code: 200, message: "OK", data: [], ofsset: offset, page, limit, totalRows, totalPage });
    }

    return res.status(200).json({ code: 200, message: "OK", data: result, ofsset: offset, page, limit, totalRows, totalPage });
  } catch (error) {
    next(error);
  }
};

// @desc Get job by user id
// @route GET /job/user/:userId
// @access Public
export const getJobByUserId = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.userId;

    const jobs = await job.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          location: 1,
          salary: 1,
          user: {
            _id: 1,
            username: 1,
            fullName: 1,
          },
        },
      },
    ]);

    return res.status(200).json({ code: 200, message: "OK", data: jobs });
  } catch (error) {
    next(error);
  }
};

// @desc Get job id
// @route GET /job/:jobId
// @access Public
export const getJobById = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;

    if (!jobId) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

    const jobFound = await job.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "appliedjobusers",
          localField: "_id",
          foreignField: "jobId",
          as: "applied",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $match: {
          _id: new mongoose.Types.ObjectId(jobId),
        },
      },
      {
        $limit: 1,
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          title: 1,
          description: 1,
          type: 1,
          level: 1,
          location: 1,
          workPlace: 1,
          salary: 1,
          isClosed: 1,
          createdAt: 1,
          updatedAt: 1,
          deletedAt: 1,
          totalAppliciants: { $size: "$applied" },
          user: {
            _id: 1,
            username: 1,
            fullName: 1,
            avatar: 1,
          },
        },
      },
    ]);

    if (!jobFound || jobFound.length === 0) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    return res.status(200).json({ code: 200, message: "OK", data: jobFound[0] });
  } catch (error) {
    next(error);
  }
};

// @desc Update job
// @route PATCH /job/:jobId
// @access Private
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

    const country: ICountry = req.body.country;
    const state: IState = req.body.state;
    const city: ICity = req.body.city;

    if (!country || !state || !city) {
      return res.status(400).json(new HttpException(400, "Bad Request"));
    }

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
    jobFound.salary = req.body.salary || jobFound.salary;
    jobFound.updatedAt = new Date();

    const updatedJob = await jobFound.updateOne(jobFound).exec();

    if (updatedJob) {
      return res.status(200).json({ code: 200, message: "OK", data: "success update" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc Delete job
// @route DELETE /job/:jobId
// @access Private
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

    const deleteUserAppliciant = await applyJobUser.deleteMany({ jobId: new mongoose.Types.ObjectId(jobId) }).exec();

    const deletedJob = await job.findOne({ _id: jobId }).deleteOne();

    if (deletedJob) {
      return res.status(200).json({ code: 200, message: "OK", data: "success delete" });
    }
  } catch (error) {
    next(error);
  }
};

// @desc apply for job
// @route POST /job/apply/:jobId
// @access Private
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

// @desc check applied for job
// @route GET /job/check-apply/:jobId
// @access Private
export const checkIsApplied = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const { userId } = jobFound;

    if (userId.toString() === req.user._id.toString()) {
      return res.status(200).json({ code: 200, message: "OK", data: true });
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

// @desc Get applications for job
// @route GET /job/applications/:jobId
// @access Private
export const getAppliciants = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    let paneQuery: string = req.query.pane as string;

    const paneMenus = ["pending", "approved", "rejected"];

    if (paneQuery === "null" || paneQuery === "undefined") {
      paneQuery = "pending";
    }

    if (!paneMenus.includes(paneQuery)) {
      paneQuery = "pending";
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
          $unwind: "$user",
        },
        {
          $project: {
            _id: 1,
            userId: 1,
            jobId: 1,
            isApprove: 1,
            createdAt: 1,
            user: {
              _id: 1,
              username: 1,
              fullName: 1,
              email: 1,
              avatar: 1,
              cv: 1,
              createdAt: 1,
            },
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

// @desc approve appliciant for job
// @route POST /job/approve/:id/:userId/:jobId
// @access Private
export const handleApproveJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const userIdAppliciant = req.params.userId;
    let message: string = req.body.message;

    if (!jobId || !userIdAppliciant) {
      return res.status(400).json(new HttpException(400, "Invalid data received"));
    }

    if (!message) {
      message = "please wait for further information";
    }

    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const userCreatedJob = await user.findOne({ _id: jobFound.userId }).lean();

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
      return mailService.sendEmailApproveJob(userFound.email, message, jobFound, userCreatedJob, res);
      // return res.status(200).json({ code: 200, message: `${userFound.username} has approved`, data: updatedAppliciant });
    } else {
      return res.status(500).json(new HttpException(500, "Server error"));
    }
  } catch (error) {
    next(error);
  }
};

// @desc reject appliciant for job
// @route POST /job/approve/:id/:userId/:jobId
// @access Private
export const handleRejectJob = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const jobId = req.params.jobId;
    const userIdAppliciant = req.params.userId;
    let message: string = req.body.message;

    if (!message) {
      message = "Sorry, you are not qualified for this job position";
    }

    if (!jobId || !userIdAppliciant) {
      return res.status(400).json(new HttpException(400, "Invalid data received"));
    }

    const jobFound = await job.findOne({ _id: jobId }).lean();

    if (!jobFound) {
      return res.status(404).json(new HttpException(404, "Job not found"));
    }

    const userFound = await user.findOne({ _id: userIdAppliciant }).lean();
    const userCreatedJob = await user.findOne({ _id: jobFound.userId }).lean();

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
      return mailService.sendEmailRejectJob(userFound.email, message, jobFound, userCreatedJob, res);
      // return res.status(200).json({ code: 200, message: `${userFound.username} has rejected`, data: updatedAppliciant });
    }

    return res.status(500).json(new HttpException(500, "Server error"));
  } catch (error) {
    next(error);
  }
};

// @desc Get aplication users
// @route POST /job/applications/:userId
// @access Private
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

// @desc Get nearly jobs
// @route POST /job/nearly
// @access Public
export const getNearlyJobs = async (req: IRequestWithUser, res: Response, next: NextFunction) => {
  try {
    const optionTypes = Object.values(EJobType).map((value: string) => value);
    const optionLevels = Object.values(EJobLevel).map((value: string) => value);
    const optionWorkPlace = Object.values(EJobWorkPlace).map((value: string) => value);

    const user: IUser = req.user;

    // =====================================================
    // Query string
    // =====================================================
    const search: string = (req.query.search as string) || "";
    let startIndex: number = parseInt(req.query.startIndex as string) || 0;
    // multiple 10
    let isTrueOffset = false;
    if (startIndex % 10 === 0) {
      isTrueOffset = true;
    }

    if (!isTrueOffset) {
      startIndex = 0;
    }

    let workplace: string = (req.query.workplace as string) || "";
    let type: string = (req.query.type as string) || "";
    let level: string = (req.query.level as string) || "";
    if (workplace && !optionWorkPlace.includes(workplace)) {
      workplace = "";
    }
    if (type && !optionTypes.includes(type)) {
      type = "";
    }
    if (level && !optionLevels.includes(level)) {
      level = "";
    }

    const page: number = parseInt(req.query.page as string) || 0;
    const limit: number = parseInt(req.query.limit as string) || 10;
    const offset: number = startIndex !== 0 ? startIndex : page * limit;
    const totalRows = await job
      .countDocuments({
        $and: [
          {
            $or: [{ "location.city.name": user.address?.city?.name }, { "location.state.isoCode": user.address?.state?.isoCode }],
          },
          { title: { $regex: search, $options: "i" } },
          {
            workPlace: { $regex: workplace, $options: "i" },
            type: { $regex: type, $options: "i" },
            level: { $regex: level, $options: "i" },
          },
        ],
      })
      .exec();
    const totalPage = Math.ceil(totalRows / limit);

    const result = await job
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        {
          $unwind: "$user",
        },
        {
          $match: {
            $and: [
              {
                $or: [{ "location.city.name": user.address?.city?.name }, { "location.state.isoCode": user.address?.state?.isoCode }],
              },
              { title: { $regex: search, $options: "i" } },
              {
                workPlace: { $regex: workplace, $options: "i" },
                type: { $regex: type, $options: "i" },
                level: { $regex: level, $options: "i" },
              },
            ],
          },
        },
        {
          $project: {
            _id: 1,
            title: 1,
            location: 1,
            salary: 1,
            createdAt: 1,
            user: {
              _id: 1,
              username: 1,
              fullName: 1,
            },
          },
        },
      ])
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    if (!result) {
      return res.status(200).json({ code: 200, message: "OK", data: [], ofsset: offset, page, limit, totalRows, totalPage });
    }

    return res.status(200).json({ code: 200, message: "OK", data: result, ofsset: offset, page, limit, totalRows, totalPage });
  } catch (error) {
    next(error);
  }
};

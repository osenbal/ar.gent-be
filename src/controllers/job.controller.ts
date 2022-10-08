import { Request, Response, NextFunction } from 'express';
import JobModel from '@models/Job.model';
import { HttpException } from '@/exceptions/HttpException';

const job = JobModel;

const createJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      userId,
      emailUser,
      title,
      description,
      category,
      salary,
      created_at,
      deleted_at,
    } = req.body;

    const image = req.file.path;

    if (
      !userId ||
      !emailUser ||
      !image ||
      !title ||
      !description ||
      !category ||
      !salary ||
      !created_at ||
      !deleted_at
    ) {
      return res.status(400).json(new HttpException(400, 'Bad Request'));
    }

    const jobObject = {
      userId,
      emailUser,
      image,
      title,
      description,
      category,
      salary,
      created_at,
      deleted_at,
    };

    const newJob = await job.create(jobObject);

    if (newJob) {
      return res
        .status(201)
        .json({ code: 201, message: 'Created', data: newJob });
    } else {
      return res
        .status(400)
        .json(new HttpException(400, 'Invalid job data received'));
    }
  } catch (error) {
    next(error);
  }
};

const getAllJob = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const jobs = await job.find().lean();

    return res.status(200).json({ code: 200, message: 'OK', data: jobs });
  } catch (error) {
    next(error);
  }
};

export { createJob, getAllJob };

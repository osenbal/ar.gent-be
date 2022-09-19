import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { createJob } from '@controllers/job.controller';

class JobRoute implements Routes {
  public path = '/job/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.route(`${this.path}all`).get((req, res) => {
      res.send('all jobs');
    });

    this.router.route(`${this.path}create`).post(createJob);
  }
}

export default JobRoute;

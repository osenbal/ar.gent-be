import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import { createJob, getAllJob } from '@controllers/job.controller';
// import uploadStorage, { filterImage } from '@middlewares/storage.middleware';

class JobRoute implements Routes {
  public path = '/job/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // this.router.route(`${this.path}all`).get(getAllJob);
    // this.router
    //   .route(`${this.path}create`)
    //   .post(uploadStorage('job', 'image', filterImage), createJob);
  }
}

export default JobRoute;

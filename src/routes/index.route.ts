import { Router } from 'express';
import { Routes } from '@interfaces/routes.interface';
import IndexController from '@controllers/index.controller';

class IndexRoute implements Routes {
  public path = '/';
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}`, IndexController);
  }
}

export default IndexRoute;

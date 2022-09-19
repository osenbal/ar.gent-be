import { NextFunction, Request, Response } from 'express';

const IndexController = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.send('Hello World!');
  } catch (error) {
    next(error);
  }
};

export default IndexController;

import { rateLimit } from 'express-rate-limit';
import { logger } from '@utils/logger';

const limiterMiddleware = (message: string, max: number, windowMs: number) =>
  rateLimit({
    windowMs, // 1 minutes
    max, // limit each IP to 5 requests per windowMs
    message: {
      message: message,
    },
    handler: (req, res, next, options) => {
      logger.info(
        `To many request: ${options?.message?.message}\t${req.method}\t${req.url}\t${req.headers.origin}`
      );
      res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

export default limiterMiddleware;

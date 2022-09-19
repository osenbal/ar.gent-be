import { rateLimit } from 'express-rate-limit';
import { logger } from '@utils/logger';

const loginLimiterMiddleware = rateLimit({
  windowMs: 60 * 1000, // 1 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    message: 'Too many login attempts, please try again after 1 minute',
  },
  handler: (req, res, next, options) => {
    logger.info(`To many request: ${options?.message?.message}\t${req.method}\t${req.url}\t${req.headers.origin}`);
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default loginLimiterMiddleware;

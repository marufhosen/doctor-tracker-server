import { rateLimit, type RateLimitRequestHandler } from 'express-rate-limit';

import { env } from '../config/env.js';

interface RateLimiterOptions {
  windowMs: number;
  limit: number;
}

export const createRateLimiter = ({
  windowMs,
  limit,
}: RateLimiterOptions): RateLimitRequestHandler => {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => {
      response.status(429).json({
        success: false,
        message: 'Too many requests',
        error: { code: 'RATE_LIMIT_EXCEEDED' },
      });
    },
  });
};

export const apiLimiter = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX,
});

export const loginLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.LOGIN_RATE_LIMIT_MAX,
});

export const refreshLimiter = createRateLimiter({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.REFRESH_RATE_LIMIT_MAX,
});

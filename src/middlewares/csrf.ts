import { timingSafeEqual } from 'node:crypto';

import type { RequestHandler } from 'express';

import { CSRF_TOKEN_COOKIE } from '../config/cookies.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';

const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);
const csrfExemptPaths = new Set(['/api/v1/auth/login']);
const trustedOrigin = new URL(env.CORS_ORIGIN).origin;

const tokensMatch = (first: string, second: string): boolean => {
  const firstBuffer = Buffer.from(first, 'utf8');
  const secondBuffer = Buffer.from(second, 'utf8');

  return (
    firstBuffer.length === secondBuffer.length &&
    timingSafeEqual(firstBuffer, secondBuffer)
  );
};

export const csrfProtection: RequestHandler = (request, _response, next) => {
  if (safeMethods.has(request.method)) {
    next();
    return;
  }

  if (request.get('Origin') !== trustedOrigin) {
    next(new ApiError(403, 'Invalid request origin', 'CSRF_ORIGIN_INVALID'));
    return;
  }

  if (csrfExemptPaths.has(request.path)) {
    next();
    return;
  }

  const cookies: unknown = request.cookies;
  const cookieToken =
    typeof cookies === 'object' && cookies !== null
      ? (cookies as Record<string, unknown>)[CSRF_TOKEN_COOKIE]
      : undefined;
  const headerToken = request.get('X-CSRF-Token');

  if (
    typeof cookieToken !== 'string' ||
    typeof headerToken !== 'string' ||
    !tokensMatch(cookieToken, headerToken)
  ) {
    next(new ApiError(403, 'Invalid CSRF token', 'CSRF_TOKEN_INVALID'));
    return;
  }

  next();
};

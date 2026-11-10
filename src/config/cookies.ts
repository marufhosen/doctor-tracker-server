import { randomBytes } from 'node:crypto';

import type { CookieOptions, Response } from 'express';

import { env } from './env.js';

export const ACCESS_TOKEN_COOKIE = 'doctor_tracker_access';
export const REFRESH_TOKEN_COOKIE = 'doctor_tracker_refresh';
export const CSRF_TOKEN_COOKIE = 'doctor_tracker_csrf';

const accessCookiePath = '/api/v1';
const refreshCookiePath = '/api/v1/auth';
const csrfCookiePath = '/api/v1';

export interface AuthCookieInput {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export interface AuthCookieOptions {
  access: CookieOptions;
  refresh: CookieOptions;
  csrf: CookieOptions;
}

const maxAgeUntil = (expiresAt: Date, now: Date): number => {
  return Math.max(0, expiresAt.getTime() - now.getTime());
};

export const buildAuthCookieOptions = (
  input: Pick<
    AuthCookieInput,
    | 'rememberMe'
    | 'accessTokenExpiresAt'
    | 'refreshTokenExpiresAt'
    | 'absoluteExpiresAt'
  >,
  now = new Date(),
): AuthCookieOptions => {
  const secure =
    env.NODE_ENV === 'production' ||
    env.COOKIE_SECURE ||
    env.COOKIE_SAME_SITE === 'none';
  const shared: CookieOptions = {
    secure,
    sameSite: env.COOKIE_SAME_SITE,
    priority: 'high',
  };
  const persistent = (expiresAt: Date): CookieOptions =>
    input.rememberMe ? { maxAge: maxAgeUntil(expiresAt, now) } : {};
  const accessExpiresAt = new Date(
    Math.min(
      input.accessTokenExpiresAt.getTime(),
      input.absoluteExpiresAt.getTime(),
    ),
  );
  const refreshExpiresAt = new Date(
    Math.min(
      input.refreshTokenExpiresAt.getTime(),
      input.absoluteExpiresAt.getTime(),
    ),
  );

  return {
    access: {
      ...shared,
      ...persistent(accessExpiresAt),
      httpOnly: true,
      path: accessCookiePath,
    },
    refresh: {
      ...shared,
      ...persistent(refreshExpiresAt),
      httpOnly: true,
      path: refreshCookiePath,
    },
    csrf: {
      ...shared,
      ...persistent(input.absoluteExpiresAt),
      httpOnly: false,
      path: csrfCookiePath,
    },
  };
};

export const generateCsrfToken = (): string => {
  return randomBytes(32).toString('base64url');
};

export const setAuthCookies = (
  response: Response,
  input: AuthCookieInput,
): string => {
  const csrfToken = generateCsrfToken();
  const options = buildAuthCookieOptions(input);

  response.cookie(ACCESS_TOKEN_COOKIE, input.accessToken, options.access);
  response.cookie(REFRESH_TOKEN_COOKIE, input.refreshToken, options.refresh);
  response.cookie(CSRF_TOKEN_COOKIE, csrfToken, options.csrf);

  return csrfToken;
};

export const clearAuthCookies = (response: Response): void => {
  const secure =
    env.NODE_ENV === 'production' ||
    env.COOKIE_SECURE ||
    env.COOKIE_SAME_SITE === 'none';
  const shared: CookieOptions = {
    secure,
    sameSite: env.COOKIE_SAME_SITE,
  };

  response.clearCookie(ACCESS_TOKEN_COOKIE, {
    ...shared,
    httpOnly: true,
    path: accessCookiePath,
  });
  response.clearCookie(REFRESH_TOKEN_COOKIE, {
    ...shared,
    httpOnly: true,
    path: refreshCookiePath,
  });
  response.clearCookie(CSRF_TOKEN_COOKIE, {
    ...shared,
    httpOnly: false,
    path: csrfCookiePath,
  });
};

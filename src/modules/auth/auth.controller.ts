import type { RequestHandler } from 'express';

import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from '../../config/cookies.js';
import { ApiError } from '../../utils/api-error.js';
import {
  logoutSession,
  type LogoutSession,
  rotateRefreshToken,
  type RotateRefreshToken,
} from '../sessions/session.service.js';
import { getCurrentUser, type GetCurrentUser } from '../users/user.service.js';
import { login, type LoginService } from './auth.service.js';
import type { LoginInput } from './auth.validation.js';

export const createLoginController = (
  loginService: LoginService = login,
): RequestHandler => {
  return async (request, response) => {
    const input = request.validated.body as LoginInput;
    const userAgent = request.get('User-Agent');
    const result = await loginService(input, {
      ...(userAgent ? { userAgent } : {}),
      ...(request.ip ? { ipAddress: request.ip } : {}),
    });

    setAuthCookies(response, result);
    response.status(200).json({
      success: true,
      message: 'Login successful',
      data: { user: result.user },
    });
  };
};

export const createRefreshController = (
  rotationService: RotateRefreshToken = rotateRefreshToken,
): RequestHandler => {
  return async (request, response) => {
    const cookies: unknown = request.cookies;
    const refreshToken =
      typeof cookies === 'object' && cookies !== null
        ? (cookies as Record<string, unknown>)[REFRESH_TOKEN_COOKIE]
        : undefined;

    if (typeof refreshToken !== 'string') {
      clearAuthCookies(response);
      throw new ApiError(401, 'Refresh token is required', 'REFRESH_REQUIRED');
    }

    try {
      const result = await rotationService(refreshToken);
      setAuthCookies(response, result);
      response.status(200).json({
        success: true,
        message: 'Session refreshed successfully',
        data: { user: result.user },
      });
    } catch (error) {
      clearAuthCookies(response);
      throw error;
    }
  };
};

export const createCurrentUserController = (
  currentUserService: GetCurrentUser = getCurrentUser,
): RequestHandler => {
  return async (request, response) => {
    if (!request.auth) {
      throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
    }

    const user = await currentUserService(request.auth.userId);
    response.status(200).json({
      success: true,
      message: 'Current user retrieved successfully',
      data: { user },
    });
  };
};

export const createLogoutController = (
  logoutService: LogoutSession = logoutSession,
): RequestHandler => {
  return async (request, response) => {
    const cookies: unknown = request.cookies;
    const refreshToken =
      typeof cookies === 'object' && cookies !== null
        ? (cookies as Record<string, unknown>)[REFRESH_TOKEN_COOKIE]
        : undefined;

    await logoutService(
      typeof refreshToken === 'string' ? refreshToken : undefined,
    );
    clearAuthCookies(response);
    response.status(200).json({
      success: true,
      message: 'Logout successful',
      data: null,
    });
  };
};

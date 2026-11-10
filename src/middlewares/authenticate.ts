import type { RequestHandler } from 'express';

import { ACCESS_TOKEN_COOKIE, clearAuthCookies } from '../config/cookies.js';
import { SessionModel } from '../modules/sessions/session.model.js';
import { UserModel } from '../modules/users/user.model.js';
import type { UserRole } from '../modules/users/user.types.js';
import { ApiError } from '../utils/api-error.js';
import { verifyAccessToken, type AccessTokenClaims } from '../utils/jwt.js';

interface AuthenticationDependencies {
  verifyAccessToken: (token: string) => Promise<AccessTokenClaims>;
  findSession: (
    sessionId: string,
    now: Date,
  ) => Promise<{
    id: string;
    userId: string;
    isRevoked: boolean;
    absoluteExpiresAt: Date;
  } | null>;
  findUser: (userId: string) => Promise<{
    id: string;
    role: UserRole;
    isActive: boolean;
  } | null>;
  now: () => Date;
}

const defaultDependencies: AuthenticationDependencies = {
  verifyAccessToken,
  findSession: async (sessionId) => {
    const session = await SessionModel.findById(sessionId).exec();
    return session
      ? {
          id: session._id.toString(),
          userId: session.userId.toString(),
          isRevoked: session.isRevoked,
          absoluteExpiresAt: session.absoluteExpiresAt,
        }
      : null;
  },
  findUser: async (userId) => {
    const user = await UserModel.findById(userId).exec();
    return user
      ? {
          id: user._id.toString(),
          role: user.role,
          isActive: user.isActive,
        }
      : null;
  },
  now: () => new Date(),
};

export const createAuthenticate = (
  dependencies: AuthenticationDependencies = defaultDependencies,
): RequestHandler => {
  return async (request, response, next) => {
    try {
      const cookies: unknown = request.cookies;
      const accessToken =
        typeof cookies === 'object' && cookies !== null
          ? (cookies as Record<string, unknown>)[ACCESS_TOKEN_COOKIE]
          : undefined;

      if (typeof accessToken !== 'string') {
        throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
      }

      const claims = await dependencies.verifyAccessToken(accessToken);
      const now = dependencies.now();
      const session = await dependencies.findSession(claims.sid, now);

      if (
        !session ||
        session.isRevoked ||
        session.absoluteExpiresAt <= now ||
        session.userId !== claims.sub
      ) {
        throw new ApiError(401, 'Invalid session', 'INVALID_SESSION');
      }

      const user = await dependencies.findUser(claims.sub);

      if (!user?.isActive || user.role !== claims.role) {
        throw new ApiError(401, 'Invalid session', 'INVALID_SESSION');
      }

      request.auth = {
        userId: user.id,
        sessionId: session.id,
        role: user.role,
      };
      next();
    } catch (error) {
      clearAuthCookies(response);
      next(
        error instanceof ApiError
          ? error
          : new ApiError(401, 'Invalid access token', 'INVALID_ACCESS_TOKEN'),
      );
    }
  };
};

export const authenticate = createAuthenticate();

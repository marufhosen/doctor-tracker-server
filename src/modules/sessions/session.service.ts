import mongoose, { type Types } from 'mongoose';

import { env } from '../../config/env.js';
import { ApiError } from '../../utils/api-error.js';
import { durationToMilliseconds } from '../../utils/duration.js';
import { signAccessToken } from '../../utils/jwt.js';
import {
  generateRefreshToken,
  hashRefreshToken,
  isRefreshToken,
} from '../../utils/tokens.js';
import type { AuthTokens, SafeUser } from '../auth/auth.types.js';
import { UserModel } from '../users/user.model.js';
import type { UserRole } from '../users/user.types.js';
import { RefreshTokenHistoryModel } from './refresh-token.model.js';
import { SessionModel } from './session.model.js';

interface ConsumedSession {
  id: string;
  userId: Types.ObjectId;
  tokenFamilyId: string;
  rememberMe: boolean;
  refreshTokenExpiresAt: Date;
  absoluteExpiresAt: Date;
}

interface RotationUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

export interface RotationResult extends AuthTokens {
  sessionId: string;
  user: SafeUser;
}

interface RotationDependencies {
  consumeToken: (input: {
    currentHash: string;
    nextHash: string;
    now: Date;
  }) => Promise<ConsumedSession | null>;
  findConsumedToken: (
    tokenHash: string,
  ) => Promise<{ sessionId: string; tokenFamilyId: string } | null>;
  revokeTokenFamily: (tokenFamilyId: string, now: Date) => Promise<void>;
  findUser: (userId: Types.ObjectId) => Promise<RotationUser | null>;
  revokeSession: (sessionId: string, now: Date) => Promise<void>;
  signAccessToken: (input: {
    userId: string;
    sessionId: string;
    role: UserRole;
  }) => Promise<string>;
  generateRefreshToken: () => string;
  hashRefreshToken: (token: string) => string;
  now: () => Date;
}

export const consumeRefreshTokenAtomically: RotationDependencies['consumeToken'] =
  async ({ currentHash, nextHash, now }) => {
    const databaseSession = await mongoose.startSession();
    let consumedSession: ConsumedSession | null = null;

    try {
      await databaseSession.withTransaction(async () => {
        const session = await SessionModel.findOneAndUpdate(
          {
            refreshTokenHash: currentHash,
            isRevoked: false,
            refreshTokenExpiresAt: { $gt: now },
            absoluteExpiresAt: { $gt: now },
          },
          {
            $set: {
              refreshTokenHash: nextHash,
              lastRotatedAt: now,
              lastUsedAt: now,
            },
          },
          { new: false, session: databaseSession },
        )
          .select('+refreshTokenHash')
          .exec();

        if (!session) {
          return;
        }

        await RefreshTokenHistoryModel.create(
          [
            {
              sessionId: session._id,
              tokenFamilyId: session.tokenFamilyId,
              tokenHash: currentHash,
              consumedAt: now,
              expiresAt: session.refreshTokenExpiresAt,
            },
          ],
          { session: databaseSession },
        );

        consumedSession = {
          id: session._id.toString(),
          userId: session.userId,
          tokenFamilyId: session.tokenFamilyId,
          rememberMe: session.rememberMe,
          refreshTokenExpiresAt: session.refreshTokenExpiresAt,
          absoluteExpiresAt: session.absoluteExpiresAt,
        };
      });
    } finally {
      await databaseSession.endSession();
    }

    return consumedSession;
  };

const defaultDependencies: RotationDependencies = {
  consumeToken: consumeRefreshTokenAtomically,
  findConsumedToken: async (tokenHash) => {
    const consumedToken = await RefreshTokenHistoryModel.findOne({ tokenHash })
      .select('sessionId tokenFamilyId')
      .exec();
    return consumedToken
      ? {
          sessionId: consumedToken.sessionId.toString(),
          tokenFamilyId: consumedToken.tokenFamilyId,
        }
      : null;
  },
  revokeTokenFamily: async (tokenFamilyId, now) => {
    await SessionModel.updateMany(
      { tokenFamilyId, isRevoked: false },
      { $set: { isRevoked: true, revokedAt: now } },
    );
  },
  findUser: async (userId) => {
    const user = await UserModel.findById(userId).exec();
    return user
      ? {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        }
      : null;
  },
  revokeSession: async (sessionId, now) => {
    await SessionModel.updateOne(
      { _id: sessionId },
      { $set: { isRevoked: true, revokedAt: now } },
    );
  },
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  now: () => new Date(),
};

export type RotateRefreshToken = (
  presentedToken: string,
) => Promise<RotationResult>;

export const createTokenRotationService = (
  dependencies: RotationDependencies = defaultDependencies,
): RotateRefreshToken => {
  return async (presentedToken) => {
    if (!isRefreshToken(presentedToken)) {
      throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const now = dependencies.now();
    const currentHash = dependencies.hashRefreshToken(presentedToken);
    const refreshToken = dependencies.generateRefreshToken();
    const nextHash = dependencies.hashRefreshToken(refreshToken);
    const session = await dependencies.consumeToken({
      currentHash,
      nextHash,
      now,
    });

    if (!session) {
      const replay = await dependencies.findConsumedToken(currentHash);

      if (replay) {
        await dependencies.revokeTokenFamily(replay.tokenFamilyId, now);
        throw new ApiError(
          401,
          'Refresh token reuse detected',
          'REFRESH_TOKEN_REUSED',
        );
      }

      throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const user = await dependencies.findUser(session.userId);

    if (!user?.isActive) {
      await dependencies.revokeSession(session.id, now);
      throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    const accessTokenExpiresAt = new Date(
      Math.min(
        now.getTime() + durationToMilliseconds(env.ACCESS_TOKEN_TTL),
        session.absoluteExpiresAt.getTime(),
      ),
    );
    const accessToken = await dependencies.signAccessToken({
      userId: user.id,
      sessionId: session.id,
      role: user.role,
    });

    return {
      sessionId: session.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
      rememberMe: session.rememberMe,
    };
  };
};

export const rotateRefreshToken = createTokenRotationService();

export type LogoutSession = (refreshToken?: string) => Promise<void>;

export const logoutSession: LogoutSession = async (refreshToken) => {
  if (!refreshToken || !isRefreshToken(refreshToken)) {
    return;
  }

  const now = new Date();
  await SessionModel.updateOne(
    {
      refreshTokenHash: hashRefreshToken(refreshToken),
      isRevoked: false,
    },
    { $set: { isRevoked: true, revokedAt: now } },
  );
};

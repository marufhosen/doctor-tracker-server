import { randomUUID } from 'node:crypto';

import type { Types } from 'mongoose';

import { SessionModel } from '../sessions/session.model.js';
import { UserModel } from '../users/user.model.js';
import type { UserRole } from '../users/user.types.js';
import { ApiError } from '../../utils/api-error.js';
import { signAccessToken } from '../../utils/jwt.js';
import { generateRefreshToken, hashRefreshToken } from '../../utils/tokens.js';
import type { LoginInput } from './auth.validation.js';
import type {
  LoginContext,
  LoginResult,
  LoginUserRecord,
} from './auth.types.js';
import { verifyPassword } from './password.js';
import { createSessionTiming } from './session-policy.js';

interface CreateSessionInput {
  userId: Types.ObjectId;
  refreshTokenHash: string;
  tokenFamilyId: string;
  rememberMe: boolean;
  refreshTokenExpiresAt: Date;
  absoluteExpiresAt: Date;
  lastRotatedAt: Date;
  lastUsedAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

interface LoginServiceDependencies {
  findUserByEmail: (email: string) => Promise<LoginUserRecord | null>;
  verifyPassword: (passwordHash: string, password: string) => Promise<boolean>;
  createSession: (input: CreateSessionInput) => Promise<string>;
  updateLastLogin: (userId: Types.ObjectId, date: Date) => Promise<void>;
  signAccessToken: (input: {
    userId: string;
    sessionId: string;
    role: UserRole;
  }) => Promise<string>;
  generateRefreshToken: () => string;
  hashRefreshToken: (token: string) => string;
  generateTokenFamilyId: () => string;
  now: () => Date;
}

export type LoginService = (
  input: LoginInput,
  context?: LoginContext,
) => Promise<LoginResult>;

const defaultDependencies: LoginServiceDependencies = {
  findUserByEmail: async (email) => {
    const user = await UserModel.findOne({ email })
      .select('+passwordHash')
      .exec();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      objectId: user._id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      isActive: user.isActive,
    };
  },
  verifyPassword,
  createSession: async (input) => {
    const session = await SessionModel.create(input);
    return session._id.toString();
  },
  updateLastLogin: async (userId, date) => {
    await UserModel.updateOne({ _id: userId }, { $set: { lastLoginAt: date } });
  },
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generateTokenFamilyId: randomUUID,
  now: () => new Date(),
};

export const createLoginService = (
  dependencies: LoginServiceDependencies = defaultDependencies,
): LoginService => {
  return async (
    input: LoginInput,
    context: LoginContext = {},
  ): Promise<LoginResult> => {
    const user = await dependencies.findUserByEmail(input.email);

    if (
      !user ||
      !(await dependencies.verifyPassword(user.passwordHash, input.password))
    ) {
      throw new ApiError(
        401,
        'Invalid email or password',
        'INVALID_CREDENTIALS',
      );
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Account is inactive', 'ACCOUNT_INACTIVE');
    }

    const now = dependencies.now();
    const { accessTokenExpiresAt, refreshTokenExpiresAt, absoluteExpiresAt } =
      createSessionTiming(input.rememberMe, now);
    const refreshToken = dependencies.generateRefreshToken();
    const refreshTokenHash = dependencies.hashRefreshToken(refreshToken);
    const sessionId = await dependencies.createSession({
      userId: user.objectId,
      refreshTokenHash,
      tokenFamilyId: dependencies.generateTokenFamilyId(),
      rememberMe: input.rememberMe,
      refreshTokenExpiresAt,
      absoluteExpiresAt,
      lastRotatedAt: now,
      lastUsedAt: now,
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
    });
    const accessToken = await dependencies.signAccessToken({
      userId: user.id,
      sessionId,
      role: user.role,
    });

    await dependencies.updateLastLogin(user.objectId, now);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      sessionId,
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      absoluteExpiresAt,
      rememberMe: input.rememberMe,
    };
  };
};

export const login = createLoginService();

import type { Types } from 'mongoose';

import type { UserRole } from '../users/user.types.js';

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  absoluteExpiresAt: Date;
  rememberMe: boolean;
}

export interface LoginResult extends AuthTokens {
  user: SafeUser;
  sessionId: string;
}

export interface LoginContext {
  userAgent?: string;
  ipAddress?: string;
}

export interface LoginUserRecord {
  id: string;
  objectId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
}

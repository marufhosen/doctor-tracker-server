import type { HydratedDocument, Types } from 'mongoose';

export interface Session {
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
  isRevoked: boolean;
  revokedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionDocument = HydratedDocument<Session>;

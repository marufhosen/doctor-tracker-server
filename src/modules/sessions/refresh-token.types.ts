import type { HydratedDocument, Types } from 'mongoose';

export interface RefreshTokenHistory {
  sessionId: Types.ObjectId;
  tokenFamilyId: string;
  tokenHash: string;
  consumedAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type RefreshTokenHistoryDocument = HydratedDocument<RefreshTokenHistory>;

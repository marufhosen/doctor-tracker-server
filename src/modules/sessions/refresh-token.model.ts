import mongoose, { type Model } from 'mongoose';

import type { RefreshTokenHistory } from './refresh-token.types.js';

const { model, models, Schema } = mongoose;

const refreshTokenHistorySchema = new Schema<RefreshTokenHistory>(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: true,
    },
    tokenFamilyId: {
      type: String,
      required: true,
      trim: true,
    },
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    consumedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    collection: 'refresh_token_history',
    timestamps: true,
  },
);

refreshTokenHistorySchema.index({ tokenHash: 1 }, { unique: true });
refreshTokenHistorySchema.index({ tokenFamilyId: 1, consumedAt: -1 });
refreshTokenHistorySchema.index({ sessionId: 1, consumedAt: -1 });
refreshTokenHistorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenHistoryModel: Model<RefreshTokenHistory> =
  (models.RefreshTokenHistory as Model<RefreshTokenHistory> | undefined) ??
  model<RefreshTokenHistory>(
    'RefreshTokenHistory',
    refreshTokenHistorySchema,
    'refresh_token_history',
  );

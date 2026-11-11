import mongoose, { type Model } from 'mongoose';

import type { Session } from './session.types.js';

const { model, models, Schema } = mongoose;

const sessionSchema = new Schema<Session>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      select: false,
    },
    tokenFamilyId: {
      type: String,
      required: true,
      trim: true,
    },
    rememberMe: {
      type: Boolean,
      required: true,
      default: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      required: true,
    },
    absoluteExpiresAt: {
      type: Date,
      required: true,
    },
    lastRotatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    lastUsedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 1024,
    },
    ipAddress: {
      type: String,
      trim: true,
      maxlength: 64,
    },
    isRevoked: {
      type: Boolean,
      required: true,
      default: false,
    },
    revokedAt: {
      type: Date,
    },
  },
  {
    collection: 'sessions',
    timestamps: true,
  },
);

sessionSchema.index({ refreshTokenHash: 1 }, { unique: true });
sessionSchema.index({ tokenFamilyId: 1 });
sessionSchema.index({ userId: 1, isRevoked: 1, absoluteExpiresAt: 1 });
sessionSchema.index({ absoluteExpiresAt: 1 }, { expireAfterSeconds: 0 });

export const SessionModel: Model<Session> =
  (models.Session as Model<Session> | undefined) ??
  model<Session>('Session', sessionSchema, 'sessions');

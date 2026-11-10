import { model, models, Schema, type Model } from 'mongoose';

import { USER_ROLES, type User } from './user.types.js';

const userSchema = new Schema<User>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: USER_ROLES,
      default: 'USER',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    collection: 'users',
    timestamps: true,
    toJSON: {
      transform: (_document, returnedObject) => {
        const safeObject = returnedObject as unknown as Record<string, unknown>;
        delete safeObject.passwordHash;
        return returnedObject;
      },
    },
  },
);

export const UserModel: Model<User> =
  (models.User as Model<User> | undefined) ??
  model<User>('User', userSchema, 'users');

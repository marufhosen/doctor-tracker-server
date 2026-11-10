import { ApiError } from '../../utils/api-error.js';
import type { SafeUser } from '../auth/auth.types.js';
import { UserModel } from './user.model.js';

export type GetCurrentUser = (userId: string) => Promise<SafeUser>;

export const getCurrentUser: GetCurrentUser = async (userId) => {
  const user = await UserModel.findById(userId).exec();

  if (!user?.isActive) {
    throw new ApiError(401, 'Invalid session', 'INVALID_SESSION');
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
};

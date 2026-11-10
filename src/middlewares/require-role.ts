import type { RequestHandler } from 'express';

import type { UserRole } from '../modules/users/user.types.js';
import { ApiError } from '../utils/api-error.js';

export const requireRole = (...allowedRoles: UserRole[]): RequestHandler => {
  const allowed = new Set(allowedRoles);

  return (request, _response, next) => {
    if (!request.auth) {
      next(new ApiError(401, 'Authentication required', 'UNAUTHENTICATED'));
      return;
    }

    if (!allowed.has(request.auth.role)) {
      next(new ApiError(403, 'Insufficient permissions', 'FORBIDDEN'));
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole('ADMIN');

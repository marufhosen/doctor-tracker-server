export {};

import type { UserRole } from '../modules/users/user.types.js';

declare global {
  namespace Express {
    type ValidatedRequestData = Partial<
      Record<'body' | 'query' | 'params', unknown>
    >;

    interface Request {
      validated: ValidatedRequestData;
      auth?: {
        userId: string;
        sessionId: string;
        role: UserRole;
      };
    }
  }
}

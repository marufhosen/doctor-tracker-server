import { Router } from 'express';

import { validateRequest } from '../../middlewares/validate-request.js';
import { createLoginController } from './auth.controller.js';
import { login, type LoginService } from './auth.service.js';
import { loginRequestSchema } from './auth.validation.js';

export const createAuthRouter = (
  loginService: LoginService = login,
): Router => {
  const router = Router();

  router.post(
    '/login',
    validateRequest(loginRequestSchema),
    createLoginController(loginService),
  );

  return router;
};

export const authRouter = createAuthRouter();

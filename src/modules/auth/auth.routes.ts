import { Router } from 'express';

import { validateRequest } from '../../middlewares/validate-request.js';
import {
  createLoginController,
  createRefreshController,
} from './auth.controller.js';
import { login, type LoginService } from './auth.service.js';
import { loginRequestSchema } from './auth.validation.js';
import {
  rotateRefreshToken,
  type RotateRefreshToken,
} from '../sessions/session.service.js';

export const createAuthRouter = (
  loginService: LoginService = login,
  rotationService: RotateRefreshToken = rotateRefreshToken,
): Router => {
  const router = Router();

  router.post(
    '/login',
    validateRequest(loginRequestSchema),
    createLoginController(loginService),
  );
  router.post('/refresh', createRefreshController(rotationService));

  return router;
};

export const authRouter = createAuthRouter();

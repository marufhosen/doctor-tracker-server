import { Router } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import {
  createCurrentUserController,
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
  router.get('/me', authenticate, createCurrentUserController());

  return router;
};

export const authRouter = createAuthRouter();

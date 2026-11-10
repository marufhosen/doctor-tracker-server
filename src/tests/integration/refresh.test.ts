import { beforeAll, describe, expect, it, mock } from 'bun:test';

import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';

import type { LoginService } from '../../modules/auth/auth.service.js';
import type { RotateRefreshToken } from '../../modules/sessions/session.service.js';

let app: Express;
const loginService = mock(async () => {
  throw new Error('Login service should not be called');
});
const rotationService = mock(async () => ({
  user: {
    id: 'user-id',
    name: 'System Admin',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
  },
  sessionId: 'session-id',
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
  accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
  refreshTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  absoluteExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  rememberMe: false,
}));

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/doctor_tracker_test',
    CORS_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: '01234567890123456789012345678901',
    ADMIN_NAME: 'Test Admin',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'secure-password',
  });

  const { csrfProtection } = await import('../../middlewares/csrf.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');
  const { createAuthRouter } =
    await import('../../modules/auth/auth.routes.js');

  app = express();
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(
    '/api/v1/auth',
    createAuthRouter(
      loginService as unknown as LoginService,
      rotationService as unknown as RotateRefreshToken,
    ),
  );
  app.use(errorHandler);
});

describe('POST /api/v1/auth/refresh', () => {
  it('rotates auth cookies without exposing either token in JSON', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set(
        'Cookie',
        'doctor_tracker_refresh=current-refresh-token; doctor_tracker_csrf=csrf-token',
      )
      .set('X-CSRF-Token', 'csrf-token');

    expect(response.status).toBe(200);
    expect(rotationService).toHaveBeenCalledWith('current-refresh-token');
    expect(response.body.data.user.email).toBe('admin@example.com');
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(response.headers['set-cookie']).toHaveLength(3);
  });

  it('clears auth cookies when the refresh cookie is missing', async () => {
    const response = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', 'doctor_tracker_csrf=csrf-token')
      .set('X-CSRF-Token', 'csrf-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('REFRESH_REQUIRED');
    expect(response.headers['set-cookie']).toHaveLength(3);
  });
});

import { beforeAll, describe, expect, it, mock } from 'bun:test';

import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';

import type { LoginService } from '../../modules/auth/auth.service.js';

let app: Express;
const loginService = mock(async () => ({
  user: {
    id: 'user-id',
    name: 'System Admin',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
  },
  sessionId: 'session-id',
  accessToken: 'signed-access-token',
  refreshToken: 'opaque-refresh-token',
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
  app.use(express.json());
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(
    '/api/v1/auth',
    createAuthRouter(loginService as unknown as LoginService),
  );
  app.use(errorHandler);
});

describe('POST /api/v1/auth/login', () => {
  it('sets auth cookies and returns only safe user data', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({
        email: 'ADMIN@EXAMPLE.COM',
        password: 'secure-password',
        rememberMe: false,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 'user-id',
          name: 'System Admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
    });
    expect(response.body).not.toHaveProperty('accessToken');
    expect(response.body).not.toHaveProperty('refreshToken');
    expect(response.headers['set-cookie']).toHaveLength(3);
    expect(loginService).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        rememberMe: false,
      }),
      expect.objectContaining({ ipAddress: expect.any(String) }),
    );
  });

  it('rejects invalid login input before calling the service', async () => {
    const callsBeforeRequest = loginService.mock.calls.length;
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'invalid', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(loginService.mock.calls).toHaveLength(callsBeforeRequest);
  });
});

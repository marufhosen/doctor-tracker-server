import { beforeAll, describe, expect, it, mock } from 'bun:test';

import express, { type Express } from 'express';
import request from 'supertest';

let app: Express;
const currentUserService = mock(async () => ({
  id: 'user-id',
  name: 'System Admin',
  email: 'admin@example.com',
  role: 'ADMIN' as const,
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

  const { createCurrentUserController } =
    await import('../../modules/auth/auth.controller.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');

  app = express();
  app.get(
    '/api/v1/auth/me',
    (request, _response, next) => {
      request.auth = {
        userId: 'user-id',
        sessionId: 'session-id',
        role: 'ADMIN',
      };
      next();
    },
    createCurrentUserController(currentUserService),
  );
  app.use(errorHandler);
});

describe('GET /api/v1/auth/me', () => {
  it('returns safe information for the authenticated user', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(200);
    expect(currentUserService).toHaveBeenCalledWith('user-id');
    expect(response.body).toEqual({
      success: true,
      message: 'Current user retrieved successfully',
      data: {
        user: {
          id: 'user-id',
          name: 'System Admin',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
    });
    expect(response.body.data.user).not.toHaveProperty('passwordHash');
  });
});

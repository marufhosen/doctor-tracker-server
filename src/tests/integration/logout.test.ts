import { beforeAll, describe, expect, it, mock } from 'bun:test';

import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';

let app: Express;
const logoutService = mock(async () => undefined);

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

  const { createLogoutController } =
    await import('../../modules/auth/auth.controller.js');
  const { csrfProtection } = await import('../../middlewares/csrf.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');

  app = express();
  app.use(cookieParser());
  app.use(csrfProtection);
  app.post('/api/v1/auth/logout', createLogoutController(logoutService));
  app.use(errorHandler);
});

describe('POST /api/v1/auth/logout', () => {
  it('revokes the current session and clears every auth cookie', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:3000')
      .set(
        'Cookie',
        'doctor_tracker_refresh=refresh-token; doctor_tracker_csrf=csrf-token',
      )
      .set('X-CSRF-Token', 'csrf-token');

    expect(response.status).toBe(200);
    expect(logoutService).toHaveBeenCalledWith('refresh-token');
    expect(response.headers['set-cookie']).toHaveLength(3);
  });

  it('is safe to repeat with the same credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Origin', 'http://localhost:3000')
      .set(
        'Cookie',
        'doctor_tracker_refresh=refresh-token; doctor_tracker_csrf=csrf-token',
      )
      .set('X-CSRF-Token', 'csrf-token');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logout successful');
  });
});

import { beforeAll, describe, expect, it, mock } from 'bun:test';

import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';

let app: Express;
const now = new Date('2026-01-01T00:00:00.000Z');
const dependencies = {
  verifyAccessToken: mock(async () => ({
    sub: 'user-id',
    sid: 'session-id',
    role: 'ADMIN' as const,
    iss: 'doctor-tracker' as const,
    aud: 'doctor-tracker-client' as const,
    iat: 1,
    exp: 2,
  })),
  findSession: mock(async () => ({
    id: 'session-id',
    userId: 'user-id',
    isRevoked: false,
    absoluteExpiresAt: new Date('2026-01-02T00:00:00.000Z'),
  })),
  findUser: mock(async () => ({
    id: 'user-id',
    role: 'ADMIN' as const,
    isActive: true,
  })),
  now: mock(() => now),
};

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

  const { createAuthenticate } =
    await import('../../middlewares/authenticate.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');

  app = express();
  app.use(cookieParser());
  app.get('/protected', createAuthenticate(dependencies), (request, response) =>
    response.json({ auth: request.auth }),
  );
  app.use(errorHandler);
});

describe('authentication middleware', () => {
  it('attaches verified user and session context', async () => {
    const response = await request(app)
      .get('/protected')
      .set('Cookie', 'doctor_tracker_access=access-token');

    expect(response.status).toBe(200);
    expect(response.body.auth).toEqual({
      userId: 'user-id',
      sessionId: 'session-id',
      role: 'ADMIN',
    });
  });

  it('rejects missing authentication and clears cookies', async () => {
    const response = await request(app).get('/protected');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
    expect(response.headers['set-cookie']).toHaveLength(3);
  });

  it('rejects revoked sessions', async () => {
    dependencies.findSession.mockImplementationOnce(async () => ({
      id: 'session-id',
      userId: 'user-id',
      isRevoked: true,
      absoluteExpiresAt: new Date('2026-01-02T00:00:00.000Z'),
    }));
    const response = await request(app)
      .get('/protected')
      .set('Cookie', 'doctor_tracker_access=access-token');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_SESSION');
  });
});

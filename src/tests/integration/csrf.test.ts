import { beforeAll, describe, expect, it } from 'bun:test';

import cookieParser from 'cookie-parser';
import express, { type Express } from 'express';
import request from 'supertest';

import type * as CsrfMiddleware from '../../middlewares/csrf.js';

let app: Express;

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

  const { csrfProtection } =
    (await import('../../middlewares/csrf.js')) as typeof CsrfMiddleware;
  const { errorHandler } = await import('../../middlewares/error-handler.js');

  app = express();
  app.use(cookieParser());
  app.use(csrfProtection);
  app.post('/api/v1/auth/login', (_request, response) =>
    response.sendStatus(204),
  );
  app.post('/api/v1/patients', (_request, response) =>
    response.sendStatus(204),
  );
  app.use(errorHandler);
});

describe('CSRF protection', () => {
  it('rejects unsafe requests from an untrusted or missing origin', async () => {
    const response = await request(app).post('/api/v1/auth/login');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_ORIGIN_INVALID');
  });

  it('allows Origin-protected login before a CSRF cookie exists', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000');

    expect(response.status).toBe(204);
  });

  it('requires matching double-submit tokens after login', async () => {
    const csrfToken = 'a'.repeat(43);
    const validResponse = await request(app)
      .post('/api/v1/patients')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `doctor_tracker_csrf=${csrfToken}`)
      .set('X-CSRF-Token', csrfToken);
    const invalidResponse = await request(app)
      .post('/api/v1/patients')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', `doctor_tracker_csrf=${csrfToken}`)
      .set('X-CSRF-Token', 'b'.repeat(43));

    expect(validResponse.status).toBe(204);
    expect(invalidResponse.status).toBe(403);
    expect(invalidResponse.body.error.code).toBe('CSRF_TOKEN_INVALID');
  });

  it('rejects matching tokens without the required entropy', async () => {
    const response = await request(app)
      .post('/api/v1/patients')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', 'doctor_tracker_csrf=predictable')
      .set('X-CSRF-Token', 'predictable');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID');
  });
});

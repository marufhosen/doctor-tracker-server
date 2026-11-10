import { beforeAll, describe, expect, it } from 'bun:test';

import express, { type Express } from 'express';
import request from 'supertest';

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

  const { createRateLimiter } =
    await import('../../middlewares/rate-limiter.js');

  app = express();
  app.get(
    '/limited',
    createRateLimiter({ windowMs: 60_000, limit: 2 }),
    (_request, response) => response.sendStatus(204),
  );
});

describe('rate limiting middleware', () => {
  it('returns standard headers and rejects requests over the limit', async () => {
    const first = await request(app).get('/limited');
    const second = await request(app).get('/limited');
    const blocked = await request(app).get('/limited');

    expect(first.status).toBe(204);
    expect(second.status).toBe(204);
    expect(first.headers['ratelimit']).toBeDefined();
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

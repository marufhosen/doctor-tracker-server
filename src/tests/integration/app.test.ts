import { beforeAll, describe, expect, it } from 'bun:test';

import type { Express } from 'express';
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

  ({ app } = await import('../../app.js'));
});

describe('application smoke tests', () => {
  it('returns application health without connecting to a database', async () => {
    const response = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000')
      .set('X-Request-Id', 'health-test-request');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'Service is healthy',
      data: { status: 'ok' },
    });
    expect(response.headers['x-request-id']).toBe('health-test-request');
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://localhost:3000',
    );
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('returns the standard response for an unknown route', async () => {
    const response = await request(app).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Resource not found',
      error: { code: 'NOT_FOUND' },
    });
  });
});

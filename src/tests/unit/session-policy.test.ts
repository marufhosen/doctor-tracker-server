import { beforeAll, describe, expect, it } from 'bun:test';

import type * as SessionPolicy from '../../modules/auth/session-policy.js';

let createSessionTiming: typeof SessionPolicy.createSessionTiming;

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/doctor_tracker_test',
    CORS_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: '01234567890123456789012345678901',
    ACCESS_TOKEN_TTL: '15m',
    REFRESH_TOKEN_TTL: '24h',
    REMEMBER_ME_TTL: '30d',
    ADMIN_NAME: 'Test Admin',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'secure-password',
  });

  ({ createSessionTiming } =
    await import('../../modules/auth/session-policy.js'));
});

const now = new Date('2026-01-01T00:00:00.000Z');

describe('Remember Me session policy', () => {
  it('uses a 24-hour absolute lifetime for standard sessions', () => {
    const timing = createSessionTiming(false, now);

    expect(timing.accessTokenExpiresAt.getTime() - now.getTime()).toBe(
      15 * 60 * 1000,
    );
    expect(timing.refreshTokenExpiresAt.getTime() - now.getTime()).toBe(
      24 * 60 * 60 * 1000,
    );
    expect(timing.absoluteExpiresAt).toEqual(timing.refreshTokenExpiresAt);
  });

  it('uses a 30-day absolute lifetime for remembered sessions', () => {
    const timing = createSessionTiming(true, now);

    expect(timing.absoluteExpiresAt.getTime() - now.getTime()).toBe(
      30 * 24 * 60 * 60 * 1000,
    );
    expect(timing.refreshTokenExpiresAt).toEqual(timing.absoluteExpiresAt);
  });
});

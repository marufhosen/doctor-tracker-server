import { beforeAll, describe, expect, it } from 'bun:test';

import type { CookieOptions, Response } from 'express';

import type * as CookieUtilities from '../../config/cookies.js';

let buildAuthCookieOptions: typeof CookieUtilities.buildAuthCookieOptions;
let generateCsrfToken: typeof CookieUtilities.generateCsrfToken;
let setAuthCookies: typeof CookieUtilities.setAuthCookies;
let clearAuthCookies: typeof CookieUtilities.clearAuthCookies;

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

  ({
    buildAuthCookieOptions,
    generateCsrfToken,
    setAuthCookies,
    clearAuthCookies,
  } = await import('../../config/cookies.js'));
});

const now = new Date('2026-01-01T00:00:00.000Z');
const accessTokenExpiresAt = new Date('2026-01-01T00:15:00.000Z');
const refreshTokenExpiresAt = new Date('2026-01-02T00:00:00.000Z');
const absoluteExpiresAt = new Date('2026-01-01T12:00:00.000Z');

describe('authentication cookie utilities', () => {
  it('uses HTTP-only, scoped session cookies without persistence', () => {
    const options = buildAuthCookieOptions(
      {
        rememberMe: false,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        absoluteExpiresAt,
      },
      now,
    );

    expect(options.access).toMatchObject({
      httpOnly: true,
      path: '/api/v1',
      sameSite: 'lax',
    });
    expect(options.refresh).toMatchObject({
      httpOnly: true,
      path: '/api/v1/auth',
    });
    expect(options.csrf.httpOnly).toBe(false);
    expect(options.access.maxAge).toBeUndefined();
    expect(options.refresh.maxAge).toBeUndefined();
  });

  it('bounds persistent cookies by token and absolute expirations', () => {
    const options = buildAuthCookieOptions(
      {
        rememberMe: true,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
        absoluteExpiresAt,
      },
      now,
    );

    expect(options.access.maxAge).toBe(15 * 60 * 1000);
    expect(options.refresh.maxAge).toBe(12 * 60 * 60 * 1000);
    expect(options.csrf.maxAge).toBe(12 * 60 * 60 * 1000);
  });

  it('generates URL-safe CSRF tokens with sufficient entropy', () => {
    const firstToken = generateCsrfToken();
    const secondToken = generateCsrfToken();

    expect(firstToken).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(secondToken).not.toBe(firstToken);
  });

  it('sets and clears every authentication cookie with matching scopes', () => {
    const setCalls: Array<{
      name: string;
      value: string;
      options: CookieOptions;
    }> = [];
    const clearCalls: Array<{ name: string; options: CookieOptions }> = [];
    const response = {
      cookie: (name: string, value: string, options: CookieOptions) => {
        setCalls.push({ name, value, options });
        return response;
      },
      clearCookie: (name: string, options: CookieOptions) => {
        clearCalls.push({ name, options });
        return response;
      },
    } as unknown as Response;

    setAuthCookies(response, {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      rememberMe: false,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
      absoluteExpiresAt,
    });
    clearAuthCookies(response);

    expect(setCalls.map(({ name }) => name)).toEqual([
      'doctor_tracker_access',
      'doctor_tracker_refresh',
      'doctor_tracker_csrf',
    ]);
    expect(clearCalls.map(({ name }) => name)).toEqual(
      setCalls.map(({ name }) => name),
    );
    expect(clearCalls.map(({ options }) => options.path)).toEqual([
      '/api/v1',
      '/api/v1/auth',
      '/api/v1',
    ]);
  });
});

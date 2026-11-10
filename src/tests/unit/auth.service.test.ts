import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import type * as AuthService from '../../modules/auth/auth.service.js';

let createLoginService: typeof AuthService.createLoginService;

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

  ({ createLoginService } = await import('../../modules/auth/auth.service.js'));
});

const userId = new Types.ObjectId();
const now = new Date('2026-01-01T00:00:00.000Z');
const activeUser = {
  id: userId.toString(),
  objectId: userId,
  name: 'System Admin',
  email: 'admin@example.com',
  passwordHash: 'argon2id-hash',
  role: 'ADMIN' as const,
  isActive: true,
};

const createDependencies = () => ({
  findUserByEmail: mock(
    async (): Promise<typeof activeUser | null> => activeUser,
  ),
  verifyPassword: mock(async () => true),
  createSession: mock(async () => 'session-id'),
  updateLastLogin: mock(async () => undefined),
  signAccessToken: mock(async () => 'access-token'),
  generateRefreshToken: mock(() => 'refresh-token'),
  hashRefreshToken: mock(() => 'refresh-token-hash'),
  generateTokenFamilyId: mock(() => 'family-id'),
  now: mock(() => now),
});

describe('login service', () => {
  it('creates a hashed-token session and returns safe auth data', async () => {
    const dependencies = createDependencies();
    const login = createLoginService(dependencies);

    const result = await login(
      {
        email: 'admin@example.com',
        password: 'secure-password',
        rememberMe: false,
      },
      { userAgent: 'test-agent', ipAddress: '127.0.0.1' },
    );

    expect(dependencies.createSession).toHaveBeenCalledWith(
      expect.objectContaining({
        userId,
        refreshTokenHash: 'refresh-token-hash',
        tokenFamilyId: 'family-id',
        rememberMe: false,
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1',
      }),
    );
    expect(dependencies.signAccessToken).toHaveBeenCalledWith({
      userId: userId.toString(),
      sessionId: 'session-id',
      role: 'ADMIN',
    });
    expect(dependencies.updateLastLogin).toHaveBeenCalledWith(userId, now);
    expect(result.user).toEqual({
      id: userId.toString(),
      name: 'System Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
    });
    expect(result).not.toHaveProperty('passwordHash');
    expect(result.refreshToken).toBe('refresh-token');
  });

  it('uses the same unauthorized response for unknown users and bad passwords', async () => {
    const unknownDependencies = createDependencies();
    unknownDependencies.findUserByEmail.mockImplementation(async () => null);
    const badPasswordDependencies = createDependencies();
    badPasswordDependencies.verifyPassword.mockImplementation(
      async () => false,
    );

    await expect(
      createLoginService(unknownDependencies)({
        email: 'missing@example.com',
        password: 'password',
        rememberMe: false,
      }),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
    await expect(
      createLoginService(badPasswordDependencies)({
        email: 'admin@example.com',
        password: 'wrong',
        rememberMe: false,
      }),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_CREDENTIALS' });
  });

  it('rejects inactive users before creating a session', async () => {
    const dependencies = createDependencies();
    dependencies.findUserByEmail.mockImplementation(async () => ({
      ...activeUser,
      isActive: false,
    }));

    await expect(
      createLoginService(dependencies)({
        email: 'admin@example.com',
        password: 'secure-password',
        rememberMe: false,
      }),
    ).rejects.toMatchObject({ statusCode: 403, code: 'ACCOUNT_INACTIVE' });
    expect(dependencies.createSession).not.toHaveBeenCalled();
  });
});

import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import type * as SessionService from '../../modules/sessions/session.service.js';
import { generateRefreshToken, hashRefreshToken } from '../../utils/tokens.js';

let createTokenRotationService: typeof SessionService.createTokenRotationService;

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/doctor_tracker_test',
    CORS_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: '01234567890123456789012345678901',
    ACCESS_TOKEN_TTL: '15m',
    ADMIN_NAME: 'Test Admin',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'secure-password',
  });

  ({ createTokenRotationService } =
    await import('../../modules/sessions/session.service.js'));
});

const now = new Date('2026-01-01T00:00:00.000Z');
const absoluteExpiresAt = new Date('2026-01-02T00:00:00.000Z');
const userId = new Types.ObjectId();
type ConsumedSession = {
  id: string;
  userId: Types.ObjectId;
  tokenFamilyId: string;
  rememberMe: boolean;
  refreshTokenExpiresAt: Date;
  absoluteExpiresAt: Date;
};

const createDependencies = () => ({
  consumeToken: mock(async (): Promise<ConsumedSession | null> => ({
    id: 'session-id',
    userId,
    tokenFamilyId: 'family-id',
    rememberMe: false,
    refreshTokenExpiresAt: absoluteExpiresAt,
    absoluteExpiresAt,
  })),
  findConsumedToken: mock(
    async (): Promise<{ sessionId: string; tokenFamilyId: string } | null> =>
      null,
  ),
  revokeTokenFamily: mock(async () => undefined),
  findUser: mock(async () => ({
    id: userId.toString(),
    name: 'System Admin',
    email: 'admin@example.com',
    role: 'ADMIN' as const,
    isActive: true,
  })),
  revokeSession: mock(async () => undefined),
  signAccessToken: mock(async () => 'new-access-token'),
  generateRefreshToken: mock(() => generateRefreshToken()),
  hashRefreshToken: mock((token: string) => hashRefreshToken(token)),
  now: mock(() => now),
});

describe('token rotation service', () => {
  it('atomically consumes the current token and preserves session limits', async () => {
    const dependencies = createDependencies();
    const rotate = createTokenRotationService(dependencies);
    const currentToken = generateRefreshToken();
    const result = await rotate(currentToken);

    expect(dependencies.consumeToken).toHaveBeenCalledWith({
      currentHash: hashRefreshToken(currentToken),
      nextHash: hashRefreshToken(result.refreshToken),
      now,
    });
    expect(result.rememberMe).toBe(false);
    expect(result.refreshTokenExpiresAt).toEqual(absoluteExpiresAt);
    expect(result.absoluteExpiresAt).toEqual(absoluteExpiresAt);
    expect(result.accessToken).toBe('new-access-token');
  });

  it('allows only one concurrent consumer of the same token', async () => {
    const dependencies = createDependencies();
    let available = true;
    dependencies.consumeToken.mockImplementation(async () => {
      if (!available) {
        return null;
      }
      available = false;
      return {
        id: 'session-id',
        userId,
        tokenFamilyId: 'family-id',
        rememberMe: false,
        refreshTokenExpiresAt: absoluteExpiresAt,
        absoluteExpiresAt,
      };
    });
    const rotate = createTokenRotationService(dependencies);
    const currentToken = generateRefreshToken();

    const results = await Promise.allSettled([
      rotate(currentToken),
      rotate(currentToken),
    ]);

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(
      1,
    );
    expect(results.filter(({ status }) => status === 'rejected')).toHaveLength(
      1,
    );
  });

  it('rejects malformed, expired, or already-consumed tokens', async () => {
    const malformedDependencies = createDependencies();
    await expect(
      createTokenRotationService(malformedDependencies)('invalid'),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
    expect(malformedDependencies.consumeToken).not.toHaveBeenCalled();

    const consumedDependencies = createDependencies();
    consumedDependencies.consumeToken.mockImplementation(async () => null);
    await expect(
      createTokenRotationService(consumedDependencies)(generateRefreshToken()),
    ).rejects.toMatchObject({ statusCode: 401, code: 'INVALID_REFRESH_TOKEN' });
  });

  it('revokes the token family when a consumed token is replayed', async () => {
    const dependencies = createDependencies();
    dependencies.consumeToken.mockImplementation(async () => null);
    dependencies.findConsumedToken.mockImplementation(async () => ({
      sessionId: 'session-id',
      tokenFamilyId: 'family-id',
    }));

    await expect(
      createTokenRotationService(dependencies)(generateRefreshToken()),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'REFRESH_TOKEN_REUSED',
    });
    expect(dependencies.revokeTokenFamily).toHaveBeenCalledWith(
      'family-id',
      now,
    );
    expect(dependencies.signAccessToken).not.toHaveBeenCalled();
  });
});

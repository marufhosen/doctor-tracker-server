import { beforeAll, describe, expect, it } from 'bun:test';
import { SignJWT } from 'jose';

import type * as JwtUtilities from '../../utils/jwt.js';

let signAccessToken: typeof JwtUtilities.signAccessToken;
let verifyAccessToken: typeof JwtUtilities.verifyAccessToken;

const accessSecret = '01234567890123456789012345678901';
const issuer = 'doctor-tracker';
const audience = 'doctor-tracker-client';

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/doctor_tracker_test',
    CORS_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: accessSecret,
    JWT_ISSUER: issuer,
    JWT_AUDIENCE: audience,
    ACCESS_TOKEN_TTL: '15m',
    ADMIN_NAME: 'Test Admin',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'secure-password',
  });

  ({ signAccessToken, verifyAccessToken } = await import('../../utils/jwt.js'));
});

const createToken = async (
  secret: string,
  tokenIssuer: string,
  expiration: string,
): Promise<string> => {
  return new SignJWT({ sid: 'session-id', role: 'ADMIN' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject('user-id')
    .setIssuer(tokenIssuer)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(new TextEncoder().encode(secret));
};

describe('JWT utilities', () => {
  it('signs and verifies all required access-token claims', async () => {
    const token = await signAccessToken({
      userId: 'user-id',
      sessionId: 'session-id',
      role: 'ADMIN',
    });

    const claims = await verifyAccessToken(token);

    expect(claims.sub).toBe('user-id');
    expect(claims.sid).toBe('session-id');
    expect(claims.role).toBe('ADMIN');
    expect(claims.iss).toBe(issuer);
    expect(claims.aud).toBe(audience);
    expect(claims.exp).toBeGreaterThan(claims.iat);
  });

  it('rejects tokens signed with a different key', async () => {
    const token = await createToken(
      'different-secret-0123456789012345',
      issuer,
      '15m',
    );

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects expired tokens', async () => {
    const token = await createToken(accessSecret, issuer, '0s');

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects tokens from a different issuer', async () => {
    const token = await createToken(accessSecret, 'other-issuer', '15m');

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });
});

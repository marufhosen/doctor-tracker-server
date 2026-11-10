import { describe, expect, it } from 'bun:test';

import {
  generateRefreshToken,
  hashRefreshToken,
  isRefreshToken,
  verifyRefreshTokenHash,
} from '../../utils/tokens.js';

describe('refresh-token utilities', () => {
  it('generates unique, URL-safe 384-bit opaque tokens', () => {
    const firstToken = generateRefreshToken();
    const secondToken = generateRefreshToken();

    expect(firstToken).toHaveLength(64);
    expect(isRefreshToken(firstToken)).toBe(true);
    expect(isRefreshToken(secondToken)).toBe(true);
    expect(firstToken).not.toBe(secondToken);
  });

  it('creates deterministic SHA-256 hashes without retaining raw tokens', () => {
    const token = generateRefreshToken();
    const firstHash = hashRefreshToken(token);
    const secondHash = hashRefreshToken(token);

    expect(firstHash).toHaveLength(64);
    expect(firstHash).toMatch(/^[a-f0-9]{64}$/);
    expect(firstHash).toBe(secondHash);
    expect(firstHash).not.toBe(token);
  });

  it('verifies matching token hashes and rejects mismatches', () => {
    const token = generateRefreshToken();
    const otherToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(token);

    expect(verifyRefreshTokenHash(token, tokenHash)).toBe(true);
    expect(verifyRefreshTokenHash(otherToken, tokenHash)).toBe(false);
  });

  it('rejects malformed tokens and hashes safely', () => {
    expect(() => hashRefreshToken('predictable-token')).toThrow(
      'Invalid refresh token format',
    );
    expect(verifyRefreshTokenHash('invalid', 'invalid')).toBe(false);
  });
});

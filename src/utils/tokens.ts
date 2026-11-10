import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const refreshTokenBytes = 48;
const refreshTokenLength = 64;
const sha256HexLength = 64;

export const REFRESH_TOKEN_PATTERN = new RegExp(
  `^[A-Za-z0-9_-]{${refreshTokenLength}}$`,
);

const refreshTokenHashPattern = new RegExp(`^[a-f0-9]{${sha256HexLength}}$`);

export const generateRefreshToken = (): string => {
  return randomBytes(refreshTokenBytes).toString('base64url');
};

export const isRefreshToken = (token: string): boolean => {
  return REFRESH_TOKEN_PATTERN.test(token);
};

export const hashRefreshToken = (token: string): string => {
  if (!isRefreshToken(token)) {
    throw new Error('Invalid refresh token format');
  }

  return createHash('sha256').update(token, 'utf8').digest('hex');
};

export const verifyRefreshTokenHash = (
  token: string,
  expectedHash: string,
): boolean => {
  if (!isRefreshToken(token) || !refreshTokenHashPattern.test(expectedHash)) {
    return false;
  }

  const actualHash = hashRefreshToken(token);
  return timingSafeEqual(
    Buffer.from(actualHash, 'hex'),
    Buffer.from(expectedHash, 'hex'),
  );
};

import { env } from '../../config/env.js';
import { durationToMilliseconds } from '../../utils/duration.js';

export interface SessionTiming {
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  absoluteExpiresAt: Date;
}

export const createSessionTiming = (
  rememberMe: boolean,
  now = new Date(),
): SessionTiming => {
  const absoluteDuration = durationToMilliseconds(
    rememberMe ? env.REMEMBER_ME_TTL : env.REFRESH_TOKEN_TTL,
  );
  const accessDuration = durationToMilliseconds(env.ACCESS_TOKEN_TTL);
  const absoluteExpiresAt = new Date(now.getTime() + absoluteDuration);

  return {
    accessTokenExpiresAt: new Date(
      Math.min(now.getTime() + accessDuration, absoluteExpiresAt.getTime()),
    ),
    refreshTokenExpiresAt: new Date(absoluteExpiresAt),
    absoluteExpiresAt,
  };
};

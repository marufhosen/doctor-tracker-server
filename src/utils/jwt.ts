import { SignJWT, jwtVerify } from 'jose';
import { z } from 'zod';

import { env } from '../config/env.js';
import { USER_ROLES, type UserRole } from '../modules/users/user.types.js';

const algorithm = 'HS256';
const objectIdPattern = /^[a-f\d]{24}$/i;
const signingKey = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

const accessTokenClaimsSchema = z
  .object({
    sub: z.string().regex(objectIdPattern),
    sid: z.string().regex(objectIdPattern),
    role: z.enum(USER_ROLES),
    iss: z.literal(env.JWT_ISSUER),
    aud: z.union([
      z.literal(env.JWT_AUDIENCE),
      z.array(z.literal(env.JWT_AUDIENCE)).min(1),
    ]),
    iat: z.number().int(),
    exp: z.number().int(),
  })
  .strict();

export interface SignAccessTokenInput {
  userId: string;
  sessionId: string;
  role: UserRole;
}

export type AccessTokenClaims = z.infer<typeof accessTokenClaimsSchema>;

export const signAccessToken = async (
  input: SignAccessTokenInput,
): Promise<string> => {
  return new SignJWT({ sid: input.sessionId, role: input.role })
    .setProtectedHeader({ alg: algorithm, typ: 'JWT' })
    .setSubject(input.userId)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(env.ACCESS_TOKEN_TTL)
    .sign(signingKey);
};

export const verifyAccessToken = async (
  token: string,
): Promise<AccessTokenClaims> => {
  const { payload } = await jwtVerify(token, signingKey, {
    algorithms: [algorithm],
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  return accessTokenClaimsSchema.parse(payload);
};

import { config } from 'dotenv';
import { z } from 'zod';

config({ quiet: true });

const durationPattern = /^\d+(ms|s|m|h|d)$/;
const mongoUriPattern = /^mongodb(?:\+srv)?:\/\//;

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(5000),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  REQUEST_BODY_LIMIT: z
    .string()
    .regex(/^\d+(b|kb|mb)$/i)
    .default('100kb'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  REFRESH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  MONGODB_URI: z
    .string()
    .trim()
    .regex(mongoUriPattern, 'must be a MongoDB URI'),
  CORS_ORIGIN: z.url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().trim().min(1).default('doctor-tracker'),
  JWT_AUDIENCE: z.string().trim().min(1).default('doctor-tracker-client'),
  ACCESS_TOKEN_TTL: z.string().regex(durationPattern).default('15m'),
  REFRESH_TOKEN_TTL: z.string().regex(durationPattern).default('24h'),
  REMEMBER_ME_TTL: z.string().regex(durationPattern).default('30d'),
  COOKIE_SECURE: booleanFromString.default(false),
  COOKIE_SAME_SITE: z.enum(['strict', 'lax', 'none']).default('lax'),
  ADMIN_NAME: z.string().trim().min(1),
  ADMIN_EMAIL: z.email().transform((email) => email.toLowerCase()),
  ADMIN_PASSWORD: z.string().min(12),
});

const rawEnv = {
  ...process.env,
  MONGODB_URI: process.env.MONGODB_URI ?? process.env.DATABASE_URL,
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const invalidVariables = parsedEnv.error.issues
    .map((issue) => issue.path.join('.'))
    .filter(Boolean)
    .join(', ');

  throw new Error(`Invalid environment configuration: ${invalidVariables}`);
}

export const env = Object.freeze(parsedEnv.data);
export type Environment = z.infer<typeof envSchema>;

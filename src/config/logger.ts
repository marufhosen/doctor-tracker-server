import pino from 'pino';

import { env } from './env.js';

export const logger = pino({
  name: 'doctor-tracker-server',
  level: env.LOG_LEVEL,
  base: {
    service: 'doctor-tracker-server',
    environment: env.NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'password',
      'passwordHash',
      'accessToken',
      'refreshToken',
      'token',
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers.set-cookie',
      '*.password',
      '*.passwordHash',
      '*.accessToken',
      '*.refreshToken',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
});

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
      'req.headers.x-csrf-token',
      'req.body.password',
      'req.body.passwordHash',
      'req.body.accessToken',
      'req.body.refreshToken',
      'req.body.token',
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

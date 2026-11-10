import { randomUUID } from 'node:crypto';

import { pinoHttp } from 'pino-http';

import { logger } from '../config/logger.js';

const requestIdPattern = /^[A-Za-z0-9._-]{1,128}$/;

export const requestLogger = pinoHttp({
  logger,
  genReqId: (request, response) => {
    const suppliedId = request.headers['x-request-id'];
    const requestId =
      typeof suppliedId === 'string' && requestIdPattern.test(suppliedId)
        ? suppliedId
        : randomUUID();

    response.setHeader('X-Request-Id', requestId);
    return requestId;
  },
});

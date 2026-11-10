import type { ErrorRequestHandler } from 'express';

import { ApiError } from '../utils/api-error.js';

type ErrorPayload = {
  code: string;
  details?: unknown;
};

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  request,
  response,
  _next,
) => {
  void _next;

  if (error instanceof ApiError) {
    const payload: ErrorPayload = { code: error.code };

    if (error.details !== undefined) {
      payload.details = error.details;
    }

    response.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: payload,
    });
    return;
  }

  request.log.error({ err: error }, 'Unhandled request error');
  response.status(500).json({
    success: false,
    message: 'Internal server error',
    error: { code: 'INTERNAL_SERVER_ERROR' },
  });
};

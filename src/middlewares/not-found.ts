import type { RequestHandler } from 'express';

import { ApiError } from '../utils/api-error.js';

export const notFound: RequestHandler = (_request, _response, next) => {
  next(new ApiError(404, 'Resource not found', 'NOT_FOUND'));
};

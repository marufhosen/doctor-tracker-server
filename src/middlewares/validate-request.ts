import type { RequestHandler } from 'express';
import type { z } from 'zod';

import { ApiError } from '../utils/api-error.js';

const requestParts = ['body', 'query', 'params'] as const;
type RequestPart = (typeof requestParts)[number];

export type RequestSchema = Partial<Record<RequestPart, z.ZodType>>;

export const validateRequest = (schema: RequestSchema): RequestHandler => {
  return (request, _response, next) => {
    const validated: Express.ValidatedRequestData = {};
    const issues: Array<{
      code: string;
      message: string;
      path: PropertyKey[];
    }> = [];

    for (const part of requestParts) {
      const partSchema = schema[part];

      if (!partSchema) {
        continue;
      }

      const result = partSchema.safeParse(request[part]);

      if (result.success) {
        validated[part] = result.data;
        continue;
      }

      issues.push(
        ...result.error.issues.map((issue) => ({
          code: issue.code,
          message: issue.message,
          path: [part, ...issue.path],
        })),
      );
    }

    if (issues.length > 0) {
      next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR', issues));
      return;
    }

    request.validated = validated;
    next();
  };
};

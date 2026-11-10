import type { RequestHandler } from 'express';

import { ApiError } from '../../utils/api-error.js';
import { createDoctor, type CreateDoctor } from './doctor.service.js';
import type { CreateDoctorInput } from './doctor.validation.js';

export const createDoctorController = (
  createDoctorOperation: CreateDoctor = createDoctor,
): RequestHandler => {
  return async (request, response) => {
    if (!request.auth) {
      throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
    }

    const doctor = await createDoctorOperation(
      request.validated.body as CreateDoctorInput,
      request.auth.userId,
    );
    response.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: { doctor },
    });
  };
};

import type { RequestHandler } from 'express';

import { ApiError } from '../../utils/api-error.js';
import {
  createDoctor,
  listDoctors,
  type CreateDoctor,
  type ListDoctors,
} from './doctor.service.js';
import type {
  CreateDoctorInput,
  DoctorListQuery,
} from './doctor.validation.js';

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

export const listDoctorsController = (
  listDoctorsOperation: ListDoctors = listDoctors,
): RequestHandler => {
  return async (request, response) => {
    const result = await listDoctorsOperation(
      request.validated.query as DoctorListQuery,
    );
    response.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      data: result.doctors,
      meta: result.meta,
    });
  };
};

import type { RequestHandler } from 'express';

import { createPatient, type CreatePatient } from './patient.service.js';
import type {
  CreatePatientInput,
  DoctorPatientParams,
} from './patient.validation.js';

export const createPatientController = (
  createPatientOperation: CreatePatient = createPatient,
): RequestHandler => {
  return async (request, response) => {
    const { doctorId } = request.validated.params as DoctorPatientParams;
    const patient = await createPatientOperation(
      doctorId,
      request.validated.body as CreatePatientInput,
    );

    response.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: { patient },
    });
  };
};

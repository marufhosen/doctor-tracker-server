import type { RequestHandler } from 'express';

import {
  createPatient,
  listDoctorPatients,
  type CreatePatient,
  type ListDoctorPatients,
} from './patient.service.js';
import type {
  CreatePatientInput,
  DoctorPatientParams,
  PatientListQuery,
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

export const listDoctorPatientsController = (
  listPatientsOperation: ListDoctorPatients = listDoctorPatients,
): RequestHandler => {
  return async (request, response) => {
    const { doctorId } = request.validated.params as DoctorPatientParams;
    const result = await listPatientsOperation(
      doctorId,
      request.validated.query as Omit<PatientListQuery, 'doctorId'>,
    );

    response.status(200).json({
      success: true,
      message: 'Doctor patients retrieved successfully',
      data: result.patients,
      meta: result.meta,
    });
  };
};

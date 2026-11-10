import type { RequestHandler } from 'express';

import {
  createPatient,
  getPatientDetails,
  listDoctorPatients,
  listPatients,
  type CreatePatient,
  type GetPatientDetails,
  type ListDoctorPatients,
  type ListPatients,
} from './patient.service.js';
import type {
  CreatePatientInput,
  DoctorPatientParams,
  PatientIdParams,
  PatientListQuery,
} from './patient.validation.js';

export const getPatientDetailsController = (
  getPatientOperation: GetPatientDetails = getPatientDetails,
): RequestHandler => {
  return async (request, response) => {
    const { id } = request.validated.params as PatientIdParams;
    const patient = await getPatientOperation(id);

    response.status(200).json({
      success: true,
      message: 'Patient retrieved successfully',
      data: { patient },
    });
  };
};

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

export const listPatientsController = (
  listPatientsOperation: ListPatients = listPatients,
): RequestHandler => {
  return async (request, response) => {
    const result = await listPatientsOperation(
      request.validated.query as PatientListQuery,
    );

    response.status(200).json({
      success: true,
      message: 'Patients retrieved successfully',
      data: result.patients,
      meta: result.meta,
    });
  };
};

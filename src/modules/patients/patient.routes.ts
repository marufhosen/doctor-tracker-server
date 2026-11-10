import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import {
  createPatientController,
  listDoctorPatientsController,
  listPatientsController,
} from './patient.controller.js';
import {
  createPatient,
  listDoctorPatients,
  listPatients,
  type CreatePatient,
  type ListDoctorPatients,
  type ListPatients,
} from './patient.service.js';
import {
  createPatientRequestSchema,
  doctorPatientListRequestSchema,
  patientListRequestSchema,
} from './patient.validation.js';

export const createDoctorPatientRouter = (
  createPatientOperation: CreatePatient = createPatient,
  authenticationMiddleware: RequestHandler = authenticate,
  listPatientsOperation: ListDoctorPatients = listDoctorPatients,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get(
    '/:doctorId/patients',
    validateRequest(doctorPatientListRequestSchema),
    listDoctorPatientsController(listPatientsOperation),
  );
  router.post(
    '/:doctorId/patients',
    requireAdmin,
    validateRequest(createPatientRequestSchema),
    createPatientController(createPatientOperation),
  );

  return router;
};

export const doctorPatientRouter = createDoctorPatientRouter();

export const createPatientRouter = (
  listPatientsOperation: ListPatients = listPatients,
  authenticationMiddleware: RequestHandler = authenticate,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get(
    '/',
    validateRequest(patientListRequestSchema),
    listPatientsController(listPatientsOperation),
  );

  return router;
};

export const patientRouter = createPatientRouter();

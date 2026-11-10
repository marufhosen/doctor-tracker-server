import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import {
  createPatientController,
  deletePatientController,
  getPatientDetailsController,
  listDoctorPatientsController,
  listPatientsController,
  updatePatientController,
} from './patient.controller.js';
import {
  createPatient,
  deletePatient,
  getPatientDetails,
  listDoctorPatients,
  listPatients,
  updatePatient,
  type CreatePatient,
  type DeletePatient,
  type GetPatientDetails,
  type ListDoctorPatients,
  type ListPatients,
  type UpdatePatient,
} from './patient.service.js';
import {
  createPatientRequestSchema,
  doctorPatientListRequestSchema,
  patientDetailsRequestSchema,
  patientListRequestSchema,
  updatePatientRequestSchema,
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
  getPatientOperation: GetPatientDetails = getPatientDetails,
  updatePatientOperation: UpdatePatient = updatePatient,
  deletePatientOperation: DeletePatient = deletePatient,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get(
    '/',
    validateRequest(patientListRequestSchema),
    listPatientsController(listPatientsOperation),
  );
  router.patch(
    '/:id',
    requireAdmin,
    validateRequest(updatePatientRequestSchema),
    updatePatientController(updatePatientOperation),
  );
  router.delete(
    '/:id',
    requireAdmin,
    validateRequest(patientDetailsRequestSchema),
    deletePatientController(deletePatientOperation),
  );
  router.get(
    '/:id',
    validateRequest(patientDetailsRequestSchema),
    getPatientDetailsController(getPatientOperation),
  );

  return router;
};

export const patientRouter = createPatientRouter();

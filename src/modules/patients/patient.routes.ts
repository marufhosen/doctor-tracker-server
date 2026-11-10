import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { createPatientController } from './patient.controller.js';
import { createPatient, type CreatePatient } from './patient.service.js';
import { createPatientRequestSchema } from './patient.validation.js';

export const createDoctorPatientRouter = (
  createPatientOperation: CreatePatient = createPatient,
  authenticationMiddleware: RequestHandler = authenticate,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.post(
    '/:doctorId/patients',
    requireAdmin,
    validateRequest(createPatientRequestSchema),
    createPatientController(createPatientOperation),
  );

  return router;
};

export const doctorPatientRouter = createDoctorPatientRouter();

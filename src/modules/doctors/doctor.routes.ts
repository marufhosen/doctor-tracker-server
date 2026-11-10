import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import {
  createDoctorController,
  listDoctorsController,
} from './doctor.controller.js';
import {
  createDoctor,
  listDoctors,
  type CreateDoctor,
  type ListDoctors,
} from './doctor.service.js';
import {
  createDoctorRequestSchema,
  doctorListRequestSchema,
} from './doctor.validation.js';

export const createDoctorRouter = (
  createDoctorOperation: CreateDoctor = createDoctor,
  authenticationMiddleware: RequestHandler = authenticate,
  listDoctorsOperation: ListDoctors = listDoctors,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get(
    '/',
    validateRequest(doctorListRequestSchema),
    listDoctorsController(listDoctorsOperation),
  );
  router.post(
    '/',
    requireAdmin,
    validateRequest(createDoctorRequestSchema),
    createDoctorController(createDoctorOperation),
  );

  return router;
};

export const doctorRouter = createDoctorRouter();

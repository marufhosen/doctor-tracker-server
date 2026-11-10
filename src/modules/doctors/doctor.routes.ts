import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import {
  createDoctorController,
  doctorDetailsController,
  listDoctorsController,
} from './doctor.controller.js';
import {
  createDoctor,
  getDoctorDetails,
  listDoctors,
  type CreateDoctor,
  type GetDoctorDetails,
  type ListDoctors,
} from './doctor.service.js';
import {
  createDoctorRequestSchema,
  doctorDetailsRequestSchema,
  doctorListRequestSchema,
} from './doctor.validation.js';

export const createDoctorRouter = (
  createDoctorOperation: CreateDoctor = createDoctor,
  authenticationMiddleware: RequestHandler = authenticate,
  listDoctorsOperation: ListDoctors = listDoctors,
  getDoctorDetailsOperation: GetDoctorDetails = getDoctorDetails,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get(
    '/',
    validateRequest(doctorListRequestSchema),
    listDoctorsController(listDoctorsOperation),
  );
  router.get(
    '/:id',
    validateRequest(doctorDetailsRequestSchema),
    doctorDetailsController(getDoctorDetailsOperation),
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

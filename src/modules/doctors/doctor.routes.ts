import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { requireAdmin } from '../../middlewares/require-role.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { createDoctorController } from './doctor.controller.js';
import { createDoctor, type CreateDoctor } from './doctor.service.js';
import { createDoctorRequestSchema } from './doctor.validation.js';

export const createDoctorRouter = (
  createDoctorOperation: CreateDoctor = createDoctor,
  authenticationMiddleware: RequestHandler = authenticate,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.post(
    '/',
    requireAdmin,
    validateRequest(createDoctorRequestSchema),
    createDoctorController(createDoctorOperation),
  );

  return router;
};

export const doctorRouter = createDoctorRouter();

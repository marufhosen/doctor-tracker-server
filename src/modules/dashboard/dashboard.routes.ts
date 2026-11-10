import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { dashboardSummaryController } from './dashboard.controller.js';
import {
  getDashboardSummary,
  type GetDashboardSummary,
} from './dashboard.service.js';

export const createDashboardRouter = (
  getSummaryOperation: GetDashboardSummary = getDashboardSummary,
  authenticationMiddleware: RequestHandler = authenticate,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get('/summary', dashboardSummaryController(getSummaryOperation));

  return router;
};

export const dashboardRouter = createDashboardRouter();

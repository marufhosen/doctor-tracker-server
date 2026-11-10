import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import {
  dashboardSummaryController,
  doctorPatientAnalyticsController,
} from './dashboard.controller.js';
import {
  getDashboardSummary,
  getDoctorPatientAnalytics,
  type GetDashboardSummary,
  type GetDoctorPatientAnalytics,
} from './dashboard.service.js';

export const createDashboardRouter = (
  getSummaryOperation: GetDashboardSummary = getDashboardSummary,
  authenticationMiddleware: RequestHandler = authenticate,
  getDoctorAnalyticsOperation: GetDoctorPatientAnalytics = getDoctorPatientAnalytics,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get('/summary', dashboardSummaryController(getSummaryOperation));
  router.get(
    '/patients-by-doctor',
    doctorPatientAnalyticsController(getDoctorAnalyticsOperation),
  );

  return router;
};

export const dashboardRouter = createDashboardRouter();

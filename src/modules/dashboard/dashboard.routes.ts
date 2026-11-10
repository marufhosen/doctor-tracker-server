import { Router, type RequestHandler } from 'express';

import { authenticate } from '../../middlewares/authenticate.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import {
  dashboardTrendsController,
  dashboardSummaryController,
  doctorPatientAnalyticsController,
} from './dashboard.controller.js';
import {
  getDashboardSummary,
  getDoctorPatientAnalytics,
  getDashboardTrends,
  type GetDashboardSummary,
  type GetDoctorPatientAnalytics,
  type GetDashboardTrends,
} from './dashboard.service.js';
import { dashboardTrendsRequestSchema } from './dashboard.validation.js';

export const createDashboardRouter = (
  getSummaryOperation: GetDashboardSummary = getDashboardSummary,
  authenticationMiddleware: RequestHandler = authenticate,
  getDoctorAnalyticsOperation: GetDoctorPatientAnalytics = getDoctorPatientAnalytics,
  getTrendsOperation: GetDashboardTrends = getDashboardTrends,
): Router => {
  const router = Router();

  router.use(authenticationMiddleware);
  router.get('/summary', dashboardSummaryController(getSummaryOperation));
  router.get(
    '/patients-by-doctor',
    doctorPatientAnalyticsController(getDoctorAnalyticsOperation),
  );
  router.get(
    '/trends',
    validateRequest(dashboardTrendsRequestSchema),
    dashboardTrendsController(getTrendsOperation),
  );

  return router;
};

export const dashboardRouter = createDashboardRouter();

import type { RequestHandler } from 'express';

import {
  getDashboardSummary,
  getDoctorPatientAnalytics,
  type GetDashboardSummary,
  type GetDoctorPatientAnalytics,
} from './dashboard.service.js';

export const dashboardSummaryController = (
  getSummaryOperation: GetDashboardSummary = getDashboardSummary,
): RequestHandler => {
  return async (_request, response) => {
    const summary = await getSummaryOperation();

    response.status(200).json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: { summary },
    });
  };
};

export const doctorPatientAnalyticsController = (
  getAnalyticsOperation: GetDoctorPatientAnalytics = getDoctorPatientAnalytics,
): RequestHandler => {
  return async (_request, response) => {
    const doctors = await getAnalyticsOperation();

    response.status(200).json({
      success: true,
      message: 'Doctor patient analytics retrieved successfully',
      data: { doctors },
    });
  };
};

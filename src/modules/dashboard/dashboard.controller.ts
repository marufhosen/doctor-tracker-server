import type { RequestHandler } from 'express';

import {
  getDashboardSummary,
  getDoctorPatientAnalytics,
  getDashboardTrends,
  type GetDashboardSummary,
  type GetDoctorPatientAnalytics,
  type GetDashboardTrends,
} from './dashboard.service.js';
import type { DashboardTrendsQuery } from './dashboard.validation.js';

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

export const dashboardTrendsController = (
  getTrendsOperation: GetDashboardTrends = getDashboardTrends,
): RequestHandler => {
  return async (request, response) => {
    const trends = await getTrendsOperation(
      request.validated.query as DashboardTrendsQuery,
    );

    response.status(200).json({
      success: true,
      message: 'Dashboard trends retrieved successfully',
      data: { trends },
    });
  };
};

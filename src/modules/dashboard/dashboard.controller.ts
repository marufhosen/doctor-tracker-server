import type { RequestHandler } from 'express';

import {
  getDashboardSummary,
  type GetDashboardSummary,
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

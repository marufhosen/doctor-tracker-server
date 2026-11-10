import { describe, expect, it, mock } from 'bun:test';
import type { PipelineStage } from 'mongoose';

import { createGetDashboardTrendsService } from '../../modules/dashboard/dashboard.service.js';
import { dashboardTrendsQuerySchema } from '../../modules/dashboard/dashboard.validation.js';

describe('dashboard trends service', () => {
  it('aggregates doctor and patient creation by UTC day within a date range', async () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T23:59:59.999Z');
    const aggregateDoctors = mock(async (pipeline: PipelineStage[]) => {
      void pipeline;
      return [{ _id: '2026-01-03', count: 2 }];
    });
    const aggregatePatients = mock(async (pipeline: PipelineStage[]) => {
      void pipeline;
      return [{ _id: '2026-01-03', count: 7 }];
    });

    const result = await createGetDashboardTrendsService({
      aggregateDoctors,
      aggregatePatients,
    })({ from, to });

    expect(aggregateDoctors.mock.calls[0]?.[0]?.[0]).toEqual({
      $match: { createdAt: { $gte: from, $lte: to } },
    });
    expect(aggregatePatients).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      doctors: [{ date: '2026-01-03', count: 2 }],
      patients: [{ date: '2026-01-03', count: 7 }],
    });
  });

  it('rejects a reversed date range', () => {
    const result = dashboardTrendsQuerySchema.safeParse({
      from: '2026-02-01',
      to: '2026-01-01',
    });

    expect(result.success).toBe(false);
  });
});

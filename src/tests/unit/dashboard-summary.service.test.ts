import { describe, expect, it, mock } from 'bun:test';

import { createGetDashboardSummaryService } from '../../modules/dashboard/dashboard.service.js';

describe('dashboard summary service', () => {
  it('counts doctors and patients in parallel', async () => {
    const dependencies = {
      countDoctors: mock(async () => 8),
      countPatients: mock(async () => 34),
    };

    const result = await createGetDashboardSummaryService(dependencies)();

    expect(dependencies.countDoctors).toHaveBeenCalledTimes(1);
    expect(dependencies.countPatients).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ totalDoctors: 8, totalPatients: 34 });
  });
});

import { describe, expect, it, mock } from 'bun:test';
import { Types, type PipelineStage } from 'mongoose';

import { createGetDoctorPatientAnalyticsService } from '../../modules/dashboard/dashboard.service.js';

describe('doctor patient analytics service', () => {
  it('aggregates patient counts and maps doctor identity', async () => {
    const doctorId = new Types.ObjectId();
    const aggregate = mock(async (pipeline: PipelineStage[]) => {
      void pipeline;
      return [{ _id: doctorId, name: 'Dr. Samira Khan', patientCount: 12 }];
    });

    const result = await createGetDoctorPatientAnalyticsService({
      aggregate,
    })();

    expect(aggregate).toHaveBeenCalledTimes(1);
    expect(aggregate.mock.calls[0]?.[0]).toEqual([
      {
        $lookup: {
          from: 'patients',
          localField: '_id',
          foreignField: 'doctorId',
          as: 'patients',
        },
      },
      {
        $project: {
          name: 1,
          patientCount: { $size: '$patients' },
        },
      },
      { $sort: { patientCount: -1, name: 1, _id: 1 } },
    ]);
    expect(result).toEqual([
      {
        doctorId: doctorId.toString(),
        doctorName: 'Dr. Samira Khan',
        patientCount: 12,
      },
    ]);
  });
});

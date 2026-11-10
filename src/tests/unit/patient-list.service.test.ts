import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createListPatientsService } from '../../modules/patients/patient.service.js';

const patient = {
  _id: new Types.ObjectId(),
  doctorId: new Types.ObjectId(),
  name: 'Rahim Ahmed',
  condition: 'Hypertension',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('patient listing service', () => {
  it('returns global patients with stable pagination', async () => {
    const dependencies = {
      find: mock(async () => [patient]),
      count: mock(async () => 25),
    };
    const listPatients = createListPatientsService(dependencies);

    const result = await listPatients({
      page: 2,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(dependencies.find).toHaveBeenCalledWith({
      filter: {},
      skip: 10,
      limit: 10,
      sort: { name: 1, _id: 1 },
    });
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
  });
});

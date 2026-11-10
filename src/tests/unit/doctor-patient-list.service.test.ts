import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createListDoctorPatientsService } from '../../modules/patients/patient.service.js';

const doctorId = new Types.ObjectId();
const patient = {
  _id: new Types.ObjectId(),
  doctorId,
  name: 'Rahim Ahmed',
  condition: 'Hypertension',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('doctor patient listing service', () => {
  it('verifies the doctor and returns stable pagination', async () => {
    const dependencies = {
      doctorExists: mock(async () => true),
      find: mock(async () => [patient]),
      count: mock(async () => 11),
    };
    const listPatients = createListDoctorPatientsService(dependencies);

    const result = await listPatients(doctorId.toString(), {
      page: 2,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(dependencies.find).toHaveBeenCalledWith({
      filter: { doctorId },
      skip: 10,
      limit: 10,
      sort: { createdAt: -1, _id: -1 },
    });
    expect(result.meta.totalPages).toBe(2);
    expect(result.patients[0]?.doctorId).toBe(doctorId.toString());
  });

  it('searches only within the selected doctor', async () => {
    const dependencies = {
      doctorExists: mock(async () => true),
      find: mock(async () => [patient]),
      count: mock(async () => 1),
    };

    await createListDoctorPatientsService(dependencies)(doctorId.toString(), {
      search: 'Rahim',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const filter = { doctorId, $text: { $search: 'Rahim' } };
    expect(dependencies.find).toHaveBeenCalledWith(
      expect.objectContaining({ filter }),
    );
    expect(dependencies.count).toHaveBeenCalledWith(filter);
  });

  it('rejects a missing doctor even when no patients exist', async () => {
    const dependencies = {
      doctorExists: mock(async () => false),
      find: mock(async () => []),
      count: mock(async () => 0),
    };

    await expect(
      createListDoctorPatientsService(dependencies)(doctorId.toString(), {
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'DOCTOR_NOT_FOUND' });
  });
});

import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createUpdatePatientService } from '../../modules/patients/patient.service.js';

const patient = {
  _id: new Types.ObjectId(),
  doctorId: new Types.ObjectId(),
  name: 'Rahim Ahmed',
  condition: 'Recovered',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('patient update service', () => {
  it('updates and returns a patient', async () => {
    const dependencies = { updateById: mock(async () => patient) };
    const input = { condition: patient.condition };

    const result = await createUpdatePatientService(dependencies)(
      patient._id.toString(),
      input,
    );

    expect(dependencies.updateById).toHaveBeenCalledWith(patient._id, input);
    expect(result.condition).toBe(patient.condition);
  });

  it('rejects an unknown patient', async () => {
    const dependencies = { updateById: mock(async () => null) };

    await expect(
      createUpdatePatientService(dependencies)(patient._id.toString(), {
        name: 'Updated name',
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'PATIENT_NOT_FOUND' });
  });
});

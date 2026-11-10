import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createDeletePatientService } from '../../modules/patients/patient.service.js';

const patient = {
  _id: new Types.ObjectId(),
  doctorId: new Types.ObjectId(),
  name: 'Rahim Ahmed',
  condition: 'Recovered',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('patient deletion service', () => {
  it('deletes a patient by ID', async () => {
    const dependencies = { deleteById: mock(async () => patient) };

    await createDeletePatientService(dependencies)(patient._id.toString());

    expect(dependencies.deleteById).toHaveBeenCalledWith(patient._id);
  });

  it('rejects an unknown patient', async () => {
    const dependencies = { deleteById: mock(async () => null) };

    await expect(
      createDeletePatientService(dependencies)(patient._id.toString()),
    ).rejects.toMatchObject({ statusCode: 404, code: 'PATIENT_NOT_FOUND' });
  });
});

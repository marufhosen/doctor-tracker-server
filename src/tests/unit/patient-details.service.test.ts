import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createGetPatientDetailsService } from '../../modules/patients/patient.service.js';

const patient = {
  _id: new Types.ObjectId(),
  doctorId: new Types.ObjectId(),
  name: 'Rahim Ahmed',
  condition: 'Hypertension',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('patient details service', () => {
  it('returns a patient by ID', async () => {
    const dependencies = { findById: mock(async () => patient) };

    const result = await createGetPatientDetailsService(dependencies)(
      patient._id.toString(),
    );

    expect(dependencies.findById).toHaveBeenCalledWith(patient._id);
    expect(result).toMatchObject({
      id: patient._id.toString(),
      doctorId: patient.doctorId.toString(),
      name: patient.name,
    });
  });

  it('rejects an unknown patient', async () => {
    const dependencies = { findById: mock(async () => null) };

    await expect(
      createGetPatientDetailsService(dependencies)(patient._id.toString()),
    ).rejects.toMatchObject({ statusCode: 404, code: 'PATIENT_NOT_FOUND' });
  });
});

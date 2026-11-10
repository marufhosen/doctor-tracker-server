import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createPatientService } from '../../modules/patients/patient.service.js';

const doctorId = new Types.ObjectId();
const patient = {
  _id: new Types.ObjectId(),
  doctorId,
  name: 'Rahim Ahmed',
  condition: 'Hypertension',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('patient creation service', () => {
  it('verifies the doctor and creates its patient', async () => {
    const dependencies = {
      doctorExists: mock(async () => true),
      create: mock(async () => patient),
    };
    const createPatient = createPatientService(dependencies);

    const result = await createPatient(doctorId.toString(), {
      name: patient.name,
      condition: patient.condition,
    });

    expect(dependencies.doctorExists).toHaveBeenCalledWith(doctorId);
    expect(dependencies.create).toHaveBeenCalledWith({
      doctorId,
      name: patient.name,
      condition: patient.condition,
    });
    expect(result.doctorId).toBe(doctorId.toString());
  });

  it('rejects an unknown doctor before creating a patient', async () => {
    const dependencies = {
      doctorExists: mock(async () => false),
      create: mock(async () => patient),
    };

    await expect(
      createPatientService(dependencies)(doctorId.toString(), {
        name: patient.name,
        condition: patient.condition,
      }),
    ).rejects.toMatchObject({ statusCode: 404, code: 'DOCTOR_NOT_FOUND' });
    expect(dependencies.create).not.toHaveBeenCalled();
  });
});

import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createDeleteDoctorPatientService } from '../../modules/patients/patient.service.js';

const patient = {
  _id: new Types.ObjectId(),
  doctorId: new Types.ObjectId(),
  name: 'Rahim Ahmed',
  condition: 'Recovered',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
};

describe('doctor patient deletion service', () => {
  it('deletes only a patient belonging to the selected doctor', async () => {
    const dependencies = {
      doctorExists: mock(async () => true),
      deleteOne: mock(async () => patient),
    };

    await createDeleteDoctorPatientService(dependencies)(
      patient.doctorId.toString(),
      patient._id.toString(),
    );

    expect(dependencies.deleteOne).toHaveBeenCalledWith({
      _id: patient._id,
      doctorId: patient.doctorId,
    });
  });

  it('does not delete when the patient does not belong to the doctor', async () => {
    const dependencies = {
      doctorExists: mock(async () => true),
      deleteOne: mock(async () => null),
    };

    await expect(
      createDeleteDoctorPatientService(dependencies)(
        patient.doctorId.toString(),
        patient._id.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: 'PATIENT_NOT_FOUND' });
  });

  it('rejects an unknown doctor before deleting a patient', async () => {
    const dependencies = {
      doctorExists: mock(async () => false),
      deleteOne: mock(async () => patient),
    };

    await expect(
      createDeleteDoctorPatientService(dependencies)(
        patient.doctorId.toString(),
        patient._id.toString(),
      ),
    ).rejects.toMatchObject({ statusCode: 404, code: 'DOCTOR_NOT_FOUND' });
    expect(dependencies.deleteOne).not.toHaveBeenCalled();
  });
});

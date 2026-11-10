import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createGetDoctorDetailsService } from '../../modules/doctors/doctor.service.js';

const doctor = {
  _id: new Types.ObjectId(),
  name: 'Dr. Samira Khan',
  specialization: 'Cardiology',
  hospital: 'City Hospital',
  phone: '+880 1712-345678',
  email: 'samira@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('doctor details service', () => {
  it('returns the requested doctor', async () => {
    const findById = mock(async () => doctor);
    const getDoctorDetails = createGetDoctorDetailsService({ findById });

    const result = await getDoctorDetails(doctor._id.toString());

    expect(findById).toHaveBeenCalledWith(doctor._id.toString());
    expect(result).toMatchObject({
      id: doctor._id.toString(),
      name: doctor.name,
      email: doctor.email,
    });
  });

  it('returns a standard 404 when the doctor does not exist', async () => {
    const getDoctorDetails = createGetDoctorDetailsService({
      findById: mock(async () => null),
    });

    await expect(
      getDoctorDetails(new Types.ObjectId().toString()),
    ).rejects.toMatchObject({
      statusCode: 404,
      code: 'DOCTOR_NOT_FOUND',
    });
  });
});

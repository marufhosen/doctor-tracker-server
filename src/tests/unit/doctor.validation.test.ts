import { describe, expect, it } from 'bun:test';

import {
  createDoctorBodySchema,
  doctorIdParamsSchema,
  doctorListQuerySchema,
} from '../../modules/doctors/doctor.validation.js';

describe('doctor validation', () => {
  it('normalizes valid doctor creation input', () => {
    const result = createDoctorBodySchema.parse({
      name: '  Dr. Samira Khan  ',
      specialization: '  Cardiology  ',
      hospital: '  City Hospital  ',
      phone: '+880 1712-345678',
      email: '  SAMIRA@EXAMPLE.COM  ',
    });

    expect(result.name).toBe('Dr. Samira Khan');
    expect(result.email).toBe('samira@example.com');
  });

  it('rejects invalid contact data and privileged unknown fields', () => {
    expect(
      createDoctorBodySchema.safeParse({
        name: 'Doctor',
        specialization: 'Medicine',
        hospital: 'Hospital',
        phone: 'invalid',
        email: 'invalid',
        createdBy: '507f1f77bcf86cd799439011',
      }).success,
    ).toBe(false);
  });

  it('applies bounded pagination and allowlisted sorting defaults', () => {
    const result = doctorListQuerySchema.parse({});

    expect(result).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(doctorListQuerySchema.safeParse({ limit: '101' }).success).toBe(
      false,
    );
    expect(doctorListQuerySchema.safeParse({ sortBy: '$where' }).success).toBe(
      false,
    );
  });

  it('validates date ranges and MongoDB ObjectIds', () => {
    expect(
      doctorListQuerySchema.safeParse({
        createdFrom: '2026-02-01',
        createdTo: '2026-01-01',
      }).success,
    ).toBe(false);
    expect(
      doctorIdParamsSchema.safeParse({ id: '507f1f77bcf86cd799439011' })
        .success,
    ).toBe(true);
    expect(doctorIdParamsSchema.safeParse({ id: 'invalid' }).success).toBe(
      false,
    );
  });
});

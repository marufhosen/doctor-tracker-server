import { describe, expect, it } from 'bun:test';

import {
  createPatientBodySchema,
  patientListQuerySchema,
  updatePatientBodySchema,
} from '../../modules/patients/patient.validation.js';

describe('patient validation', () => {
  it('normalizes valid patient creation input', () => {
    const result = createPatientBodySchema.parse({
      name: '  Rahim Ahmed  ',
      condition: '  Hypertension  ',
      email: '  RAHIM@EXAMPLE.COM  ',
      age: 42,
      gender: 'MALE',
    });

    expect(result.name).toBe('Rahim Ahmed');
    expect(result.email).toBe('rahim@example.com');
  });

  it('rejects doctor assignment and invalid demographic values', () => {
    expect(
      createPatientBodySchema.safeParse({
        name: 'Patient',
        condition: 'Condition',
        doctorId: '507f1f77bcf86cd799439011',
      }).success,
    ).toBe(false);
    expect(
      createPatientBodySchema.safeParse({
        name: 'Patient',
        condition: 'Condition',
        age: 151,
        gender: 'UNKNOWN',
      }).success,
    ).toBe(false);
  });

  it('requires at least one safe update field', () => {
    expect(updatePatientBodySchema.safeParse({}).success).toBe(false);
    expect(
      updatePatientBodySchema.safeParse({ condition: 'Recovered' }).success,
    ).toBe(true);
    expect(
      updatePatientBodySchema.safeParse({ doctorId: 'new-doctor' }).success,
    ).toBe(false);
  });

  it('bounds pagination and validates patient filters', () => {
    expect(patientListQuerySchema.parse({})).toMatchObject({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    expect(patientListQuerySchema.safeParse({ limit: '101' }).success).toBe(
      false,
    );
    expect(
      patientListQuerySchema.safeParse({ doctorId: 'invalid' }).success,
    ).toBe(false);
  });
});

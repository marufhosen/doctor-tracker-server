import { describe, expect, it } from 'bun:test';
import { Types } from 'mongoose';

import { PatientModel } from '../../modules/patients/patient.model.js';

const validPatient = {
  doctorId: new Types.ObjectId(),
  name: '  Rahim Ahmed  ',
  condition: '  Hypertension  ',
};

describe('PatientModel', () => {
  it('requires a doctor and normalizes patient information', async () => {
    const patient = new PatientModel({
      ...validPatient,
      phone: '+880 1712-345678',
      email: '  RAHIM@EXAMPLE.COM  ',
      address: '  Dhaka  ',
      age: 42,
      gender: 'MALE',
    });

    await patient.validate();

    expect(patient.name).toBe('Rahim Ahmed');
    expect(patient.condition).toBe('Hypertension');
    expect(patient.email).toBe('rahim@example.com');
    expect(patient.address).toBe('Dhaka');
  });

  it('requires doctorId, name, and condition', async () => {
    const patient = new PatientModel({});

    await expect(patient.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('rejects invalid optional demographic and contact values', async () => {
    const patient = new PatientModel({
      ...validPatient,
      email: 'invalid',
      phone: 'short',
      age: 42.5,
      gender: 'UNKNOWN',
    });

    await expect(patient.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('defines indexes for search, ownership, condition, and stable sorting', () => {
    const indexes = PatientModel.schema.indexes();

    expect(
      indexes.some(([, options]) => options.name === 'patient_search'),
    ).toBe(true);
    expect(
      indexes.some(
        ([fields]) =>
          fields.doctorId === 1 && fields.createdAt === -1 && fields._id === -1,
      ),
    ).toBe(true);
    expect(
      indexes.some(
        ([fields]) =>
          fields.condition === 1 &&
          fields.createdAt === -1 &&
          fields._id === -1,
      ),
    ).toBe(true);
  });
});

import { describe, expect, it } from 'bun:test';
import { Types } from 'mongoose';

import { DoctorModel } from '../../modules/doctors/doctor.model.js';

const validDoctor = {
  name: '  Dr. Samira Khan  ',
  specialization: '  Cardiology  ',
  hospital: '  City Hospital  ',
  phone: '+880 1712-345678',
  email: '  SAMIRA@EXAMPLE.COM  ',
};

describe('DoctorModel', () => {
  it('normalizes doctor fields and accepts an optional creator', async () => {
    const createdBy = new Types.ObjectId();
    const doctor = new DoctorModel({ ...validDoctor, createdBy });

    await doctor.validate();

    expect(doctor.name).toBe('Dr. Samira Khan');
    expect(doctor.specialization).toBe('Cardiology');
    expect(doctor.hospital).toBe('City Hospital');
    expect(doctor.email).toBe('samira@example.com');
    expect(doctor.createdBy).toEqual(createdBy);
  });

  it('requires every specification field', async () => {
    const doctor = new DoctorModel({});

    await expect(doctor.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('rejects invalid email addresses and phone numbers', async () => {
    const doctor = new DoctorModel({
      ...validDoctor,
      email: 'not-an-email',
      phone: 'invalid',
    });

    await expect(doctor.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('defines optimized search and filtered sorting indexes', () => {
    const indexes = DoctorModel.schema.indexes();
    const searchIndex = indexes.find(
      ([, options]) => options.name === 'doctor_search',
    );
    const stableSortIndex = indexes.find(
      ([fields]) => fields.createdAt === -1 && fields._id === -1,
    );
    const emailOnlyIndex = indexes.find(
      ([fields]) => Object.keys(fields).length === 1 && fields.email === 1,
    );
    const filteredSortIndex = indexes.find(
      ([fields]) =>
        fields.specialization === 1 &&
        fields.hospital === 1 &&
        fields.createdAt === -1 &&
        fields._id === -1,
    );
    const redundantSpecializationIndex = indexes.find(
      ([fields]) =>
        Object.keys(fields).length === 3 &&
        fields.specialization === 1 &&
        fields.createdAt === -1 &&
        fields._id === -1,
    );

    expect(searchIndex).toBeDefined();
    expect(stableSortIndex).toBeDefined();
    expect(filteredSortIndex).toBeDefined();
    expect(redundantSpecializationIndex).toBeUndefined();
    expect(emailOnlyIndex?.[1].unique).not.toBe(true);
  });
});

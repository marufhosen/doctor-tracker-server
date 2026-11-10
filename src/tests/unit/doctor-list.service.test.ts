import { describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import { createListDoctorsService } from '../../modules/doctors/doctor.service.js';

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

describe('doctor listing service', () => {
  it('paginates with stable sorting and returns metadata', async () => {
    const dependencies = {
      find: mock(async () => [doctor]),
      count: mock(async () => 21),
    };
    const listDoctors = createListDoctorsService(dependencies);

    const result = await listDoctors({
      page: 2,
      limit: 10,
      sortBy: 'name',
      sortOrder: 'asc',
    });

    expect(dependencies.find).toHaveBeenCalledWith({
      filter: {},
      skip: 10,
      limit: 10,
      sort: { name: 1, _id: 1 },
    });
    expect(result.doctors[0]?.id).toBe(doctor._id.toString());
    expect(result.meta).toEqual({
      page: 2,
      limit: 10,
      total: 21,
      totalPages: 3,
    });
  });

  it('returns zero total pages for an empty collection', async () => {
    const listDoctors = createListDoctorsService({
      find: mock(async () => []),
      count: mock(async () => 0),
    });

    const result = await listDoctors({
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    expect(result.meta.totalPages).toBe(0);
  });

  it('uses the bounded MongoDB text index for search', async () => {
    const dependencies = {
      find: mock(async () => [doctor]),
      count: mock(async () => 1),
    };
    const listDoctors = createListDoctorsService(dependencies);

    await listDoctors({
      search: 'Samira Cardiology',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const filter = { $text: { $search: 'Samira Cardiology' } };
    expect(dependencies.find).toHaveBeenCalledWith(
      expect.objectContaining({ filter }),
    );
    expect(dependencies.count).toHaveBeenCalledWith(filter);
  });

  it('combines specialization, hospital, and date filters safely', async () => {
    const dependencies = {
      find: mock(async () => [doctor]),
      count: mock(async () => 1),
    };
    const listDoctors = createListDoctorsService(dependencies);
    const createdFrom = new Date('2026-01-01T00:00:00.000Z');
    const createdTo = new Date('2026-01-31T23:59:59.999Z');

    await listDoctors({
      specialization: 'Cardiology',
      hospital: 'City Hospital',
      createdFrom,
      createdTo,
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const filter = {
      specialization: 'Cardiology',
      hospital: 'City Hospital',
      createdAt: { $gte: createdFrom, $lte: createdTo },
    };
    expect(dependencies.find).toHaveBeenCalledWith(
      expect.objectContaining({ filter }),
    );
    expect(dependencies.count).toHaveBeenCalledWith(filter);
  });
});

import { Types, type QueryFilter } from 'mongoose';

import {
  createPaginationMeta,
  type PaginationMeta,
} from '../../utils/pagination.js';
import { DoctorModel } from './doctor.model.js';
import type { Doctor } from './doctor.types.js';
import type {
  CreateDoctorInput,
  DoctorListQuery,
} from './doctor.validation.js';

export interface DoctorOutput {
  id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const toDoctorOutput = (
  doctor: Doctor & { _id: Types.ObjectId },
): DoctorOutput => ({
  id: doctor._id.toString(),
  name: doctor.name,
  specialization: doctor.specialization,
  hospital: doctor.hospital,
  phone: doctor.phone,
  email: doctor.email,
  ...(doctor.createdBy ? { createdBy: doctor.createdBy.toString() } : {}),
  createdAt: doctor.createdAt,
  updatedAt: doctor.updatedAt,
});

interface CreateDoctorDependencies {
  create: (
    input: CreateDoctorInput & { createdBy: Types.ObjectId },
  ) => Promise<Doctor & { _id: Types.ObjectId }>;
}

const defaultCreateDependencies: CreateDoctorDependencies = {
  create: async (input) => DoctorModel.create(input),
};

export type CreateDoctor = (
  input: CreateDoctorInput,
  createdBy: string,
) => Promise<DoctorOutput>;

export const createDoctorService = (
  dependencies: CreateDoctorDependencies = defaultCreateDependencies,
): CreateDoctor => {
  return async (input, createdBy) => {
    const doctor = await dependencies.create({
      ...input,
      createdBy: new Types.ObjectId(createdBy),
    });
    return toDoctorOutput(doctor);
  };
};

export const createDoctor = createDoctorService();

interface DoctorListDependencies {
  find: (input: {
    filter: QueryFilter<Doctor>;
    skip: number;
    limit: number;
    sort: Record<string, 1 | -1>;
  }) => Promise<Array<Doctor & { _id: Types.ObjectId }>>;
  count: (filter: QueryFilter<Doctor>) => Promise<number>;
}

const defaultListDependencies: DoctorListDependencies = {
  find: async ({ filter, skip, limit, sort }) =>
    DoctorModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
  count: async (filter) => DoctorModel.countDocuments(filter).exec(),
};

const createDoctorFilter = (query: DoctorListQuery): QueryFilter<Doctor> => {
  const filter: QueryFilter<Doctor> = query.search
    ? { $text: { $search: query.search } }
    : {};

  if (query.specialization) {
    filter.specialization = query.specialization;
  }

  if (query.hospital) {
    filter.hospital = query.hospital;
  }

  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {
      ...(query.createdFrom ? { $gte: query.createdFrom } : {}),
      ...(query.createdTo ? { $lte: query.createdTo } : {}),
    };
  }

  return filter;
};

export interface DoctorListResult {
  doctors: DoctorOutput[];
  meta: PaginationMeta;
}

export type ListDoctors = (query: DoctorListQuery) => Promise<DoctorListResult>;

export const createListDoctorsService = (
  dependencies: DoctorListDependencies = defaultListDependencies,
): ListDoctors => {
  return async (query) => {
    const filter = createDoctorFilter(query);
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = {
      [query.sortBy]: direction,
      _id: direction,
    };
    const skip = (query.page - 1) * query.limit;
    const [doctors, total] = await Promise.all([
      dependencies.find({ filter, skip, limit: query.limit, sort }),
      dependencies.count(filter),
    ]);

    return {
      doctors: doctors.map(toDoctorOutput),
      meta: createPaginationMeta(query.page, query.limit, total),
    };
  };
};

export const listDoctors = createListDoctorsService();

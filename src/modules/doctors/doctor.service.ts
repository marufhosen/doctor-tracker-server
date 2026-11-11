import mongoose, {
  type QueryFilter,
  type Types as MongooseTypes,
} from 'mongoose';

import {
  createPaginationMeta,
  type PaginationMeta,
} from '../../utils/pagination.js';
import { createPartialMatch } from '../../utils/search.js';
import { ApiError } from '../../utils/api-error.js';
import { DoctorModel } from './doctor.model.js';
import type { Doctor } from './doctor.types.js';
import type {
  CreateDoctorInput,
  DoctorListQuery,
} from './doctor.validation.js';

const { Types } = mongoose;

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
  doctor: Doctor & { _id: MongooseTypes.ObjectId },
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
    input: CreateDoctorInput & { createdBy: MongooseTypes.ObjectId },
  ) => Promise<Doctor & { _id: MongooseTypes.ObjectId }>;
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
  }) => Promise<Array<Doctor & { _id: MongooseTypes.ObjectId }>>;
  count: (filter: QueryFilter<Doctor>) => Promise<number>;
}

const defaultListDependencies: DoctorListDependencies = {
  find: async ({ filter, skip, limit, sort }) =>
    DoctorModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
  count: async (filter) => DoctorModel.countDocuments(filter).exec(),
};

const createDoctorFilter = (query: DoctorListQuery): QueryFilter<Doctor> => {
  const filter: QueryFilter<Doctor> = {};

  if (query.search) {
    const search = createPartialMatch(query.search);
    filter.$or = [
      { name: search },
      { specialization: search },
      { hospital: search },
      { email: search },
      { phone: search },
    ];
  }

  if (query.specialization) {
    filter.specialization = createPartialMatch(query.specialization);
  }

  if (query.hospital) {
    filter.hospital = createPartialMatch(query.hospital);
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

interface DoctorDetailsDependencies {
  findById: (
    id: string,
  ) => Promise<(Doctor & { _id: MongooseTypes.ObjectId }) | null>;
}

const defaultDetailsDependencies: DoctorDetailsDependencies = {
  findById: async (id) => DoctorModel.findById(id).lean().exec(),
};

export type GetDoctorDetails = (id: string) => Promise<DoctorOutput>;

export const createGetDoctorDetailsService = (
  dependencies: DoctorDetailsDependencies = defaultDetailsDependencies,
): GetDoctorDetails => {
  return async (id) => {
    const doctor = await dependencies.findById(id);

    if (!doctor) {
      throw new ApiError(404, 'Doctor not found', 'DOCTOR_NOT_FOUND');
    }

    return toDoctorOutput(doctor);
  };
};

export const getDoctorDetails = createGetDoctorDetailsService();

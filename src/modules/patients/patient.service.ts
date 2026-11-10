import { Types } from 'mongoose';

import { ApiError } from '../../utils/api-error.js';
import {
  createPaginationMeta,
  type PaginationMeta,
} from '../../utils/pagination.js';
import { DoctorModel } from '../doctors/doctor.model.js';
import { PatientModel } from './patient.model.js';
import type { Patient } from './patient.types.js';
import type {
  CreatePatientInput,
  PatientListQuery,
} from './patient.validation.js';

export interface PatientOutput {
  id: string;
  doctorId: string;
  name: string;
  condition: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: Patient['gender'];
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

const toPatientOutput = (
  patient: Patient & { _id: Types.ObjectId },
): PatientOutput => ({
  id: patient._id.toString(),
  doctorId: patient.doctorId.toString(),
  name: patient.name,
  condition: patient.condition,
  ...(patient.phone ? { phone: patient.phone } : {}),
  ...(patient.email ? { email: patient.email } : {}),
  ...(patient.age !== undefined ? { age: patient.age } : {}),
  ...(patient.gender ? { gender: patient.gender } : {}),
  ...(patient.address ? { address: patient.address } : {}),
  createdAt: patient.createdAt,
  updatedAt: patient.updatedAt,
});

interface CreatePatientDependencies {
  doctorExists: (doctorId: Types.ObjectId) => Promise<boolean>;
  create: (
    input: CreatePatientInput & { doctorId: Types.ObjectId },
  ) => Promise<Patient & { _id: Types.ObjectId }>;
}

const defaultCreateDependencies: CreatePatientDependencies = {
  doctorExists: async (doctorId) =>
    (await DoctorModel.exists({ _id: doctorId })) !== null,
  create: async (input) =>
    PatientModel.create({
      doctorId: input.doctorId,
      name: input.name,
      condition: input.condition,
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.age !== undefined ? { age: input.age } : {}),
      ...(input.gender !== undefined ? { gender: input.gender } : {}),
      ...(input.address !== undefined ? { address: input.address } : {}),
    }),
};

export type CreatePatient = (
  doctorId: string,
  input: CreatePatientInput,
) => Promise<PatientOutput>;

export const createPatientService = (
  dependencies: CreatePatientDependencies = defaultCreateDependencies,
): CreatePatient => {
  return async (doctorId, input) => {
    const doctorObjectId = new Types.ObjectId(doctorId);

    if (!(await dependencies.doctorExists(doctorObjectId))) {
      throw new ApiError(404, 'Doctor not found', 'DOCTOR_NOT_FOUND');
    }

    return toPatientOutput(
      await dependencies.create({ ...input, doctorId: doctorObjectId }),
    );
  };
};

export const createPatient = createPatientService();

interface DoctorPatientListDependencies {
  doctorExists: (doctorId: Types.ObjectId) => Promise<boolean>;
  find: (input: {
    doctorId: Types.ObjectId;
    skip: number;
    limit: number;
    sort: Record<string, 1 | -1>;
  }) => Promise<Array<Patient & { _id: Types.ObjectId }>>;
  count: (doctorId: Types.ObjectId) => Promise<number>;
}

const defaultDoctorPatientListDependencies: DoctorPatientListDependencies = {
  doctorExists: defaultCreateDependencies.doctorExists,
  find: async ({ doctorId, skip, limit, sort }) =>
    PatientModel.find({ doctorId })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
  count: async (doctorId) => PatientModel.countDocuments({ doctorId }).exec(),
};

export interface PatientListResult {
  patients: PatientOutput[];
  meta: PaginationMeta;
}

export type ListDoctorPatients = (
  doctorId: string,
  query: Omit<PatientListQuery, 'doctorId'>,
) => Promise<PatientListResult>;

export const createListDoctorPatientsService = (
  dependencies: DoctorPatientListDependencies = defaultDoctorPatientListDependencies,
): ListDoctorPatients => {
  return async (doctorId, query) => {
    const doctorObjectId = new Types.ObjectId(doctorId);

    if (!(await dependencies.doctorExists(doctorObjectId))) {
      throw new ApiError(404, 'Doctor not found', 'DOCTOR_NOT_FOUND');
    }

    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [query.sortBy]: direction, _id: direction } as Record<
      string,
      1 | -1
    >;
    const skip = (query.page - 1) * query.limit;
    const [patients, total] = await Promise.all([
      dependencies.find({
        doctorId: doctorObjectId,
        skip,
        limit: query.limit,
        sort,
      }),
      dependencies.count(doctorObjectId),
    ]);

    return {
      patients: patients.map(toPatientOutput),
      meta: createPaginationMeta(query.page, query.limit, total),
    };
  };
};

export const listDoctorPatients = createListDoctorPatientsService();

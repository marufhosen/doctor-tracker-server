import { Types, type QueryFilter } from 'mongoose';

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
  UpdatePatientInput,
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
    filter: QueryFilter<Patient>;
    skip: number;
    limit: number;
    sort: Record<string, 1 | -1>;
  }) => Promise<Array<Patient & { _id: Types.ObjectId }>>;
  count: (filter: QueryFilter<Patient>) => Promise<number>;
}

const defaultDoctorPatientListDependencies: DoctorPatientListDependencies = {
  doctorExists: defaultCreateDependencies.doctorExists,
  find: async ({ filter, skip, limit, sort }) =>
    PatientModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
  count: async (filter) => PatientModel.countDocuments(filter).exec(),
};

const createPatientFilter = (
  query: Omit<PatientListQuery, 'doctorId'>,
  doctorId?: Types.ObjectId,
): QueryFilter<Patient> => {
  const filter: QueryFilter<Patient> = {
    ...(doctorId ? { doctorId } : {}),
    ...(query.search ? { $text: { $search: query.search } } : {}),
  };

  if (query.condition) {
    filter.condition = query.condition;
  }

  if (query.createdFrom || query.createdTo) {
    filter.createdAt = {
      ...(query.createdFrom ? { $gte: query.createdFrom } : {}),
      ...(query.createdTo ? { $lte: query.createdTo } : {}),
    };
  }

  return filter;
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
    const filter = createPatientFilter(query, doctorObjectId);
    const [patients, total] = await Promise.all([
      dependencies.find({
        filter,
        skip,
        limit: query.limit,
        sort,
      }),
      dependencies.count(filter),
    ]);

    return {
      patients: patients.map(toPatientOutput),
      meta: createPaginationMeta(query.page, query.limit, total),
    };
  };
};

export const listDoctorPatients = createListDoctorPatientsService();

interface PatientListDependencies {
  find: (input: {
    filter: QueryFilter<Patient>;
    skip: number;
    limit: number;
    sort: Record<string, 1 | -1>;
  }) => Promise<Array<Patient & { _id: Types.ObjectId }>>;
  count: (filter: QueryFilter<Patient>) => Promise<number>;
}

const defaultPatientListDependencies: PatientListDependencies = {
  find: async ({ filter, skip, limit, sort }) =>
    PatientModel.find(filter).sort(sort).skip(skip).limit(limit).lean().exec(),
  count: async (filter) => PatientModel.countDocuments(filter).exec(),
};

export type ListPatients = (
  query: PatientListQuery,
) => Promise<PatientListResult>;

export const createListPatientsService = (
  dependencies: PatientListDependencies = defaultPatientListDependencies,
): ListPatients => {
  return async (query) => {
    const direction = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [query.sortBy]: direction, _id: direction } as Record<
      string,
      1 | -1
    >;
    const skip = (query.page - 1) * query.limit;
    const filter = createPatientFilter(
      query,
      query.doctorId ? new Types.ObjectId(query.doctorId) : undefined,
    );
    const [patients, total] = await Promise.all([
      dependencies.find({ filter, skip, limit: query.limit, sort }),
      dependencies.count(filter),
    ]);

    return {
      patients: patients.map(toPatientOutput),
      meta: createPaginationMeta(query.page, query.limit, total),
    };
  };
};

export const listPatients = createListPatientsService();

interface PatientDetailsDependencies {
  findById: (
    patientId: Types.ObjectId,
  ) => Promise<(Patient & { _id: Types.ObjectId }) | null>;
}

const defaultPatientDetailsDependencies: PatientDetailsDependencies = {
  findById: async (patientId) => PatientModel.findById(patientId).lean().exec(),
};

export type GetPatientDetails = (patientId: string) => Promise<PatientOutput>;

export const createGetPatientDetailsService = (
  dependencies: PatientDetailsDependencies = defaultPatientDetailsDependencies,
): GetPatientDetails => {
  return async (patientId) => {
    const patient = await dependencies.findById(new Types.ObjectId(patientId));

    if (!patient) {
      throw new ApiError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
    }

    return toPatientOutput(patient);
  };
};

export const getPatientDetails = createGetPatientDetailsService();

interface UpdatePatientDependencies {
  updateById: (
    patientId: Types.ObjectId,
    input: UpdatePatientInput,
  ) => Promise<(Patient & { _id: Types.ObjectId }) | null>;
}

const defaultUpdatePatientDependencies: UpdatePatientDependencies = {
  updateById: async (patientId, input) =>
    PatientModel.findByIdAndUpdate(
      patientId,
      { $set: input },
      { new: true, runValidators: true },
    )
      .lean()
      .exec(),
};

export type UpdatePatient = (
  patientId: string,
  input: UpdatePatientInput,
) => Promise<PatientOutput>;

export const createUpdatePatientService = (
  dependencies: UpdatePatientDependencies = defaultUpdatePatientDependencies,
): UpdatePatient => {
  return async (patientId, input) => {
    const patient = await dependencies.updateById(
      new Types.ObjectId(patientId),
      input,
    );

    if (!patient) {
      throw new ApiError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
    }

    return toPatientOutput(patient);
  };
};

export const updatePatient = createUpdatePatientService();

interface DeletePatientDependencies {
  deleteById: (
    patientId: Types.ObjectId,
  ) => Promise<(Patient & { _id: Types.ObjectId }) | null>;
}

const defaultDeletePatientDependencies: DeletePatientDependencies = {
  deleteById: async (patientId) =>
    PatientModel.findByIdAndDelete(patientId).lean().exec(),
};

export type DeletePatient = (patientId: string) => Promise<void>;

export const createDeletePatientService = (
  dependencies: DeletePatientDependencies = defaultDeletePatientDependencies,
): DeletePatient => {
  return async (patientId) => {
    const patient = await dependencies.deleteById(
      new Types.ObjectId(patientId),
    );

    if (!patient) {
      throw new ApiError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
    }
  };
};

export const deletePatient = createDeletePatientService();

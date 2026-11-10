import { Types } from 'mongoose';

import { ApiError } from '../../utils/api-error.js';
import { DoctorModel } from '../doctors/doctor.model.js';
import { PatientModel } from './patient.model.js';
import type { Patient } from './patient.types.js';
import type { CreatePatientInput } from './patient.validation.js';

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

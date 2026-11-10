import { Types } from 'mongoose';

import { DoctorModel } from './doctor.model.js';
import type { Doctor } from './doctor.types.js';
import type { CreateDoctorInput } from './doctor.validation.js';

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

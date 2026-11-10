import type { HydratedDocument, Types } from 'mongoose';

export const PATIENT_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

export interface Patient {
  doctorId: Types.ObjectId;
  name: string;
  condition: string;
  phone?: string;
  email?: string;
  age?: number;
  gender?: PatientGender;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PatientDocument = HydratedDocument<Patient>;

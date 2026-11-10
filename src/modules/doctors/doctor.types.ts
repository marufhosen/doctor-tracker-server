import type { HydratedDocument, Types } from 'mongoose';

export interface Doctor {
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type DoctorDocument = HydratedDocument<Doctor>;

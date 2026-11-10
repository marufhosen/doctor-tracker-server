import { model, models, Schema, type Model } from 'mongoose';

import { PATIENT_GENDERS, type Patient } from './patient.types.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9 ()-]{6,19}$/;

const patientSchema = new Schema<Patient>(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [phonePattern, 'Phone number is invalid'],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [emailPattern, 'Email address is invalid'],
    },
    age: {
      type: Number,
      min: 0,
      max: 150,
      validate: {
        validator: Number.isInteger,
        message: 'Age must be an integer',
      },
    },
    gender: {
      type: String,
      enum: PATIENT_GENDERS,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  {
    collection: 'patients',
    timestamps: true,
  },
);

patientSchema.index(
  { name: 'text', email: 'text', phone: 'text' },
  { name: 'patient_search', weights: { name: 10, email: 3, phone: 2 } },
);
patientSchema.index({ createdAt: -1, _id: -1 });
patientSchema.index({ doctorId: 1, createdAt: -1, _id: -1 });
patientSchema.index({ condition: 1, createdAt: -1, _id: -1 });

export const PatientModel: Model<Patient> =
  (models.Patient as Model<Patient> | undefined) ??
  model<Patient>('Patient', patientSchema, 'patients');

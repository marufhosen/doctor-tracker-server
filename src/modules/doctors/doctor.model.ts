import { model, models, Schema, type Model } from 'mongoose';

import type { Doctor } from './doctor.types.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9][0-9 ()-]{6,19}$/;

const doctorSchema = new Schema<Doctor>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    specialization: {
      type: String,
      required: true,
      trim: true,
    },
    hospital: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [phonePattern, 'Phone number is invalid'],
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [emailPattern, 'Email address is invalid'],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    collection: 'doctors',
    timestamps: true,
  },
);

doctorSchema.index(
  { name: 'text', specialization: 'text', hospital: 'text', email: 'text' },
  {
    name: 'doctor_search',
    weights: { name: 10, specialization: 5, hospital: 3, email: 1 },
  },
);
doctorSchema.index({ createdAt: -1, _id: -1 });
doctorSchema.index({
  specialization: 1,
  hospital: 1,
  createdAt: -1,
  _id: -1,
});
doctorSchema.index({ hospital: 1, createdAt: -1, _id: -1 });

export const DoctorModel: Model<Doctor> =
  (models.Doctor as Model<Doctor> | undefined) ??
  model<Doctor>('Doctor', doctorSchema, 'doctors');

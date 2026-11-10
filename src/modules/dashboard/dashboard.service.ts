import type { PipelineStage, Types } from 'mongoose';

import { DoctorModel } from '../doctors/doctor.model.js';
import { PatientModel } from '../patients/patient.model.js';

export interface DashboardSummary {
  totalDoctors: number;
  totalPatients: number;
}

interface DashboardSummaryDependencies {
  countDoctors: () => Promise<number>;
  countPatients: () => Promise<number>;
}

const defaultDashboardSummaryDependencies: DashboardSummaryDependencies = {
  countDoctors: async () => DoctorModel.countDocuments().exec(),
  countPatients: async () => PatientModel.countDocuments().exec(),
};

export type GetDashboardSummary = () => Promise<DashboardSummary>;

export const createGetDashboardSummaryService = (
  dependencies: DashboardSummaryDependencies = defaultDashboardSummaryDependencies,
): GetDashboardSummary => {
  return async () => {
    const [totalDoctors, totalPatients] = await Promise.all([
      dependencies.countDoctors(),
      dependencies.countPatients(),
    ]);

    return { totalDoctors, totalPatients };
  };
};

export const getDashboardSummary = createGetDashboardSummaryService();

interface DoctorPatientCountRecord {
  _id: Types.ObjectId;
  name: string;
  patientCount: number;
}

export interface DoctorPatientCount {
  doctorId: string;
  doctorName: string;
  patientCount: number;
}

interface DoctorPatientAnalyticsDependencies {
  aggregate: (pipeline: PipelineStage[]) => Promise<DoctorPatientCountRecord[]>;
}

const defaultDoctorPatientAnalyticsDependencies: DoctorPatientAnalyticsDependencies =
  {
    aggregate: async (pipeline) => DoctorModel.aggregate(pipeline).exec(),
  };

const doctorPatientCountPipeline: PipelineStage[] = [
  {
    $lookup: {
      from: 'patients',
      localField: '_id',
      foreignField: 'doctorId',
      as: 'patients',
    },
  },
  {
    $project: {
      name: 1,
      patientCount: { $size: '$patients' },
    },
  },
  { $sort: { patientCount: -1, name: 1, _id: 1 } },
];

export type GetDoctorPatientAnalytics = () => Promise<DoctorPatientCount[]>;

export const createGetDoctorPatientAnalyticsService = (
  dependencies: DoctorPatientAnalyticsDependencies = defaultDoctorPatientAnalyticsDependencies,
): GetDoctorPatientAnalytics => {
  return async () => {
    const records = await dependencies.aggregate(doctorPatientCountPipeline);

    return records.map((record) => ({
      doctorId: record._id.toString(),
      doctorName: record.name,
      patientCount: record.patientCount,
    }));
  };
};

export const getDoctorPatientAnalytics =
  createGetDoctorPatientAnalyticsService();

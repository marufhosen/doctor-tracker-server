import type { PipelineStage, Types } from 'mongoose';

import { DoctorModel } from '../doctors/doctor.model.js';
import { PatientModel } from '../patients/patient.model.js';
import type { DashboardTrendsQuery } from './dashboard.validation.js';

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

interface DateTrendRecord {
  _id: string;
  count: number;
}

export interface DateTrendPoint {
  date: string;
  count: number;
}

export interface DashboardTrends {
  doctors: DateTrendPoint[];
  patients: DateTrendPoint[];
}

interface DashboardTrendsDependencies {
  aggregateDoctors: (pipeline: PipelineStage[]) => Promise<DateTrendRecord[]>;
  aggregatePatients: (pipeline: PipelineStage[]) => Promise<DateTrendRecord[]>;
}

const defaultDashboardTrendsDependencies: DashboardTrendsDependencies = {
  aggregateDoctors: async (pipeline) => DoctorModel.aggregate(pipeline).exec(),
  aggregatePatients: async (pipeline) =>
    PatientModel.aggregate(pipeline).exec(),
};

const createDateTrendPipeline = (
  query: DashboardTrendsQuery,
): PipelineStage[] => {
  const pipeline: PipelineStage[] = [];

  if (query.from || query.to) {
    pipeline.push({
      $match: {
        createdAt: {
          ...(query.from ? { $gte: query.from } : {}),
          ...(query.to ? { $lte: query.to } : {}),
        },
      },
    });
  }

  pipeline.push(
    {
      $group: {
        _id: {
          $dateToString: {
            date: '$createdAt',
            format: '%Y-%m-%d',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  );

  return pipeline;
};

export type GetDashboardTrends = (
  query: DashboardTrendsQuery,
) => Promise<DashboardTrends>;

export const createGetDashboardTrendsService = (
  dependencies: DashboardTrendsDependencies = defaultDashboardTrendsDependencies,
): GetDashboardTrends => {
  return async (query) => {
    const pipeline = createDateTrendPipeline(query);
    const [doctorRecords, patientRecords] = await Promise.all([
      dependencies.aggregateDoctors(pipeline),
      dependencies.aggregatePatients(pipeline),
    ]);
    const mapRecord = (record: DateTrendRecord): DateTrendPoint => ({
      date: record._id,
      count: record.count,
    });

    return {
      doctors: doctorRecords.map(mapRecord),
      patients: patientRecords.map(mapRecord),
    };
  };
};

export const getDashboardTrends = createGetDashboardTrendsService();

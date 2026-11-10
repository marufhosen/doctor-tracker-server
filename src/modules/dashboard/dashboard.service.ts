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

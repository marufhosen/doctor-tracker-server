import { beforeAll, describe, expect, it, mock } from 'bun:test';

import express, { type Express, type RequestHandler } from 'express';
import request from 'supertest';

import type {
  GetDashboardSummary,
  GetDashboardTrends,
  GetDoctorPatientAnalytics,
} from '../../modules/dashboard/dashboard.service.js';

let app: Express;
const getSummary = mock(async () => ({
  totalDoctors: 4,
  totalPatients: 18,
})) as unknown as GetDashboardSummary;
const getDoctorAnalytics = mock(async () => [
  { doctorId: 'doctor-id', doctorName: 'Dr. Samira Khan', patientCount: 6 },
]) as unknown as GetDoctorPatientAnalytics;
const getTrends = mock(async () => ({
  doctors: [{ date: '2026-01-01', count: 1 }],
  patients: [{ date: '2026-01-01', count: 3 }],
})) as unknown as GetDashboardTrends;

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/doctor_tracker_test',
    CORS_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: '01234567890123456789012345678901',
    ADMIN_NAME: 'Test Admin',
    ADMIN_EMAIL: 'admin@example.com',
    ADMIN_PASSWORD: 'secure-password',
  });
  const { createDashboardRouter } =
    await import('../../modules/dashboard/dashboard.routes.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');
  const authenticateUser: RequestHandler = (req, _res, next) => {
    req.auth = { userId: 'user-id', sessionId: 'session-id', role: 'USER' };
    next();
  };

  app = express();
  app.use(
    '/api/v1/dashboard',
    createDashboardRouter(
      getSummary,
      authenticateUser,
      getDoctorAnalytics,
      getTrends,
    ),
  );
  app.use(errorHandler);
});

describe('dashboard endpoints', () => {
  it('returns summary and per-doctor analytics', async () => {
    const summary = await request(app).get('/api/v1/dashboard/summary');
    const doctors = await request(app).get(
      '/api/v1/dashboard/patients-by-doctor',
    );

    expect(summary.status).toBe(200);
    expect(summary.body.data.summary.totalPatients).toBe(18);
    expect(doctors.status).toBe(200);
    expect(doctors.body.data.doctors[0].patientCount).toBe(6);
  });

  it('validates and returns date-based trends', async () => {
    const response = await request(app).get(
      '/api/v1/dashboard/trends?from=2026-01-01&to=2026-01-31',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.trends.patients[0].count).toBe(3);
    expect(getTrends).toHaveBeenCalledWith({
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
    });
  });

  it('rejects reversed dashboard date ranges', async () => {
    const response = await request(app).get(
      '/api/v1/dashboard/trends?from=2026-02-01&to=2026-01-01',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

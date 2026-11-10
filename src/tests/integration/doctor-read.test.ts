import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import express, { type Express, type RequestHandler } from 'express';
import request from 'supertest';

import type {
  CreateDoctor,
  GetDoctorDetails,
  ListDoctors,
} from '../../modules/doctors/doctor.service.js';

let app: Express;
const doctorId = new Types.ObjectId().toString();
const doctor = {
  id: doctorId,
  name: 'Dr. Samira Khan',
  specialization: 'Cardiology',
  hospital: 'City Hospital',
  phone: '+880 1712-345678',
  email: 'samira@example.com',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
const listDoctors = mock(async () => ({
  doctors: [doctor],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
})) as unknown as ListDoctors;
const getDoctor = mock(async () => doctor) as unknown as GetDoctorDetails;
const createDoctor = mock(async () => doctor) as unknown as CreateDoctor;

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
  const { createDoctorRouter } =
    await import('../../modules/doctors/doctor.routes.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');
  const authenticateUser: RequestHandler = (req, _res, next) => {
    req.auth = { userId: 'user-id', sessionId: 'session-id', role: 'USER' };
    next();
  };

  app = express();
  app.use(express.json());
  app.use(
    '/api/v1/doctors',
    createDoctorRouter(createDoctor, authenticateUser, listDoctors, getDoctor),
  );
  app.use(errorHandler);
});

describe('doctor read endpoints', () => {
  it('lists validated, paginated doctors', async () => {
    const response = await request(app).get(
      '/api/v1/doctors?page=1&limit=10&specialization=Cardiology',
    );

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
    expect(listDoctors).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, limit: 10 }),
    );
  });

  it('returns doctor details', async () => {
    const response = await request(app).get(`/api/v1/doctors/${doctorId}`);

    expect(response.status).toBe(200);
    expect(response.body.data.doctor.id).toBe(doctorId);
    expect(getDoctor).toHaveBeenCalledWith(doctorId);
  });

  it('prevents non-admin users from creating doctors', async () => {
    const response = await request(app).post('/api/v1/doctors').send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
    expect(createDoctor).not.toHaveBeenCalled();
  });
});

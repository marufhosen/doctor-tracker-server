import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import cookieParser from 'cookie-parser';
import express, { type Express, type RequestHandler } from 'express';
import request from 'supertest';

import type { CreateDoctor } from '../../modules/doctors/doctor.service.js';

let app: Express;
const creatorId = new Types.ObjectId().toString();
const createDoctor = mock(async (input, createdBy) => ({
  id: new Types.ObjectId().toString(),
  ...input,
  createdBy,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
})) as unknown as CreateDoctor;

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
  const { csrfProtection } = await import('../../middlewares/csrf.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');
  const fakeAuthenticate: RequestHandler = (request, _response, next) => {
    request.auth = {
      userId: creatorId,
      sessionId: 'session-id',
      role: 'ADMIN',
    };
    next();
  };

  app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(csrfProtection);
  app.use(
    '/api/v1/doctors',
    createDoctorRouter(createDoctor, fakeAuthenticate),
  );
  app.use(errorHandler);
});

describe('POST /api/v1/doctors', () => {
  it('creates a validated doctor for an administrator', async () => {
    const response = await request(app)
      .post('/api/v1/doctors')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', 'doctor_tracker_csrf=csrf-token')
      .set('X-CSRF-Token', 'csrf-token')
      .send({
        name: 'Dr. Samira Khan',
        specialization: 'Cardiology',
        hospital: 'City Hospital',
        phone: '+880 1712-345678',
        email: 'SAMIRA@EXAMPLE.COM',
      });

    expect(response.status).toBe(201);
    expect(response.body.data.doctor.email).toBe('samira@example.com');
    expect(createDoctor).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'samira@example.com' }),
      creatorId,
    );
  });

  it('rejects invalid doctor input', async () => {
    const response = await request(app)
      .post('/api/v1/doctors')
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', 'doctor_tracker_csrf=csrf-token')
      .set('X-CSRF-Token', 'csrf-token')
      .send({ name: 'Doctor' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

import { beforeAll, describe, expect, it, mock } from 'bun:test';
import { Types } from 'mongoose';

import express, { type Express, type RequestHandler } from 'express';
import request from 'supertest';

import type {
  CreatePatient,
  DeleteDoctorPatient,
  DeletePatient,
  GetPatientDetails,
  ListDoctorPatients,
  ListPatients,
  UpdatePatient,
} from '../../modules/patients/patient.service.js';

let app: Express;
const doctorId = new Types.ObjectId().toString();
const patientId = new Types.ObjectId().toString();
const patient = {
  id: patientId,
  doctorId,
  name: 'Rahim Ahmed',
  condition: 'Hypertension',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};
const result = {
  patients: [patient],
  meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
};
const createPatient = mock(async () => patient) as unknown as CreatePatient;
const listDoctorPatients = mock(
  async () => result,
) as unknown as ListDoctorPatients;
const deleteDoctorPatient = mock(
  async () => undefined,
) as unknown as DeleteDoctorPatient;
const listPatients = mock(async () => result) as unknown as ListPatients;
const getPatient = mock(async () => patient) as unknown as GetPatientDetails;
const updatePatient = mock(async (_id, input) => ({
  ...patient,
  ...input,
})) as unknown as UpdatePatient;
const deletePatient = mock(async () => undefined) as unknown as DeletePatient;

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
  const { createDoctorPatientRouter, createPatientRouter } =
    await import('../../modules/patients/patient.routes.js');
  const { errorHandler } = await import('../../middlewares/error-handler.js');
  const authenticateAdmin: RequestHandler = (req, _res, next) => {
    req.auth = { userId: 'admin-id', sessionId: 'session-id', role: 'ADMIN' };
    next();
  };

  app = express();
  app.use(express.json());
  app.use(
    '/api/v1/doctors',
    createDoctorPatientRouter(
      createPatient,
      authenticateAdmin,
      listDoctorPatients,
      deleteDoctorPatient,
    ),
  );
  app.use(
    '/api/v1/patients',
    createPatientRouter(
      listPatients,
      authenticateAdmin,
      getPatient,
      updatePatient,
      deletePatient,
    ),
  );
  app.use(errorHandler);
});

describe('patient management endpoints', () => {
  it('creates and lists patients under a doctor', async () => {
    const createResponse = await request(app)
      .post(`/api/v1/doctors/${doctorId}/patients`)
      .send({ name: patient.name, condition: patient.condition });
    const listResponse = await request(app).get(
      `/api/v1/doctors/${doctorId}/patients`,
    );

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.patient.doctorId).toBe(doctorId);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
  });

  it('lists and retrieves patients globally', async () => {
    const listResponse = await request(app).get('/api/v1/patients?limit=10');
    const detailsResponse = await request(app).get(
      `/api/v1/patients/${patientId}`,
    );

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.meta.total).toBe(1);
    expect(detailsResponse.status).toBe(200);
    expect(detailsResponse.body.data.patient.id).toBe(patientId);
  });

  it('updates and deletes patients through both deletion routes', async () => {
    const updateResponse = await request(app)
      .patch(`/api/v1/patients/${patientId}`)
      .send({ condition: 'Recovered' });
    const deleteResponse = await request(app).delete(
      `/api/v1/patients/${patientId}`,
    );
    const nestedDeleteResponse = await request(app).delete(
      `/api/v1/doctors/${doctorId}/patients/${patientId}`,
    );

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.patient.condition).toBe('Recovered');
    expect(deleteResponse.status).toBe(200);
    expect(nestedDeleteResponse.status).toBe(200);
    expect(deleteDoctorPatient).toHaveBeenCalledWith(doctorId, patientId);
  });

  it('rejects invalid patient identifiers before service execution', async () => {
    const response = await request(app).get('/api/v1/patients/not-an-id');

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

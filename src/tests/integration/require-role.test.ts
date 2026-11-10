import { beforeAll, describe, expect, it } from 'bun:test';

import express, { type Express } from 'express';
import request from 'supertest';

import type { UserRole } from '../../modules/users/user.types.js';

let app: Express;

beforeAll(async () => {
  const { errorHandler } = await import('../../middlewares/error-handler.js');
  const { requireAdmin } = await import('../../middlewares/require-role.js');
  const attachRole = (role?: UserRole) =>
    express.Router().use((request, _response, next) => {
      if (role) {
        request.auth = {
          userId: 'user-id',
          sessionId: 'session-id',
          role,
        };
      }
      next();
    });

  app = express();
  app.get('/admin', attachRole('ADMIN'), requireAdmin, (_request, response) =>
    response.sendStatus(204),
  );
  app.get('/user', attachRole('USER'), requireAdmin, (_request, response) =>
    response.sendStatus(204),
  );
  app.get('/anonymous', attachRole(), requireAdmin, (_request, response) =>
    response.sendStatus(204),
  );
  app.use(errorHandler);
});

describe('role authorization middleware', () => {
  it('allows administrators', async () => {
    expect((await request(app).get('/admin')).status).toBe(204);
  });

  it('returns 403 for an authenticated user without the required role', async () => {
    const response = await request(app).get('/user');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 401 when authentication context is missing', async () => {
    const response = await request(app).get('/anonymous');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });
});

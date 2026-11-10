import { beforeAll, describe, expect, it, mock } from 'bun:test';

import type * as AdminBootstrap from '../../modules/users/admin-bootstrap.js';

let createAdminBootstrap: typeof AdminBootstrap.createAdminBootstrap;
let configuredAdminName: string;

beforeAll(async () => {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    MONGODB_URI: 'mongodb://localhost:27017/doctor_tracker_test',
    CORS_ORIGIN: 'http://localhost:3000',
    JWT_ACCESS_SECRET: '01234567890123456789012345678901',
    ADMIN_NAME: 'System Admin',
    ADMIN_EMAIL: 'ADMIN@EXAMPLE.COM',
    ADMIN_PASSWORD: 'secure-password',
  });

  ({ createAdminBootstrap } =
    await import('../../modules/users/admin-bootstrap.js'));
  ({ ADMIN_NAME: configuredAdminName } = (
    await import('../../config/env.js')
  ).env);
});

const createDependencies = (exists: boolean) => ({
  findByEmail: mock(async () => exists),
  hashPassword: mock(async () => 'argon2id-hash'),
  createAdmin: mock(async () => undefined),
});

describe('administrator bootstrap', () => {
  it('hashes the password and creates one normalized administrator', async () => {
    const dependencies = createDependencies(false);
    const result = await createAdminBootstrap(dependencies)();

    expect(dependencies.findByEmail).toHaveBeenCalledWith('admin@example.com');
    expect(dependencies.hashPassword).toHaveBeenCalledWith('secure-password');
    expect(dependencies.createAdmin).toHaveBeenCalledWith({
      name: configuredAdminName,
      email: 'admin@example.com',
      passwordHash: 'argon2id-hash',
    });
    expect(result).toEqual({ created: true, email: 'admin@example.com' });
  });

  it('does not hash or create when the account already exists', async () => {
    const dependencies = createDependencies(true);
    const result = await createAdminBootstrap(dependencies)();

    expect(dependencies.hashPassword).not.toHaveBeenCalled();
    expect(dependencies.createAdmin).not.toHaveBeenCalled();
    expect(result).toEqual({ created: false, email: 'admin@example.com' });
  });

  it('treats a concurrent unique-email insert as already bootstrapped', async () => {
    const dependencies = createDependencies(false);
    dependencies.createAdmin.mockImplementation(async () => {
      throw { code: 11_000 };
    });

    await expect(createAdminBootstrap(dependencies)()).resolves.toEqual({
      created: false,
      email: 'admin@example.com',
    });
  });
});

import { describe, expect, it } from 'bun:test';

import { UserModel } from '../../modules/users/user.model.js';

describe('UserModel', () => {
  it('normalizes email and applies safe defaults', async () => {
    const user = new UserModel({
      name: '  System Admin  ',
      email: '  ADMIN@EXAMPLE.COM  ',
      passwordHash: 'argon2id-hash',
    });

    await user.validate();

    expect(user.name).toBe('System Admin');
    expect(user.email).toBe('admin@example.com');
    expect(user.role).toBe('USER');
    expect(user.isActive).toBe(true);
  });

  it('requires core fields and restricts roles', async () => {
    const user = new UserModel({ role: 'SUPER_ADMIN' });

    await expect(user.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('never includes the password hash in JSON output', () => {
    const user = new UserModel({
      name: 'Admin',
      email: 'admin@example.com',
      passwordHash: 'argon2id-hash',
      role: 'ADMIN',
    });

    expect(user.toJSON()).not.toHaveProperty('passwordHash');
  });

  it('defines a unique email index and excludes password hashes by default', () => {
    const emailIndex = UserModel.schema
      .indexes()
      .find(([fields]) => fields.email === 1);

    expect(emailIndex?.[1].unique).toBe(true);
    expect(UserModel.schema.path('passwordHash').options.select).toBe(false);
  });
});

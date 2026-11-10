import { describe, expect, it } from 'bun:test';

import { loginBodySchema } from '../../modules/auth/auth.validation.js';

describe('login validation', () => {
  it('normalizes email and defaults Remember Me to false', () => {
    const result = loginBodySchema.parse({
      email: 'ADMIN@EXAMPLE.COM',
      password: 'secure-password',
    });

    expect(result).toEqual({
      email: 'admin@example.com',
      password: 'secure-password',
      rememberMe: false,
    });
  });

  it('accepts an explicit Remember Me preference', () => {
    const result = loginBodySchema.parse({
      email: 'admin@example.com',
      password: 'secure-password',
      rememberMe: true,
    });

    expect(result.rememberMe).toBe(true);
  });

  it('rejects invalid credentials and unknown fields', () => {
    expect(
      loginBodySchema.safeParse({ email: 'invalid', password: '' }).success,
    ).toBe(false);
    expect(
      loginBodySchema.safeParse({
        email: 'admin@example.com',
        password: 'password',
        role: 'ADMIN',
      }).success,
    ).toBe(false);
  });
});

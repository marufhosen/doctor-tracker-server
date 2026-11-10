import { describe, expect, it } from 'bun:test';

import { hashPassword, verifyPassword } from '../../modules/auth/password.js';

describe('password utilities', () => {
  it('hashes passwords with Argon2id and a unique salt', async () => {
    const firstHash = await hashPassword('correct horse battery staple');
    const secondHash = await hashPassword('correct horse battery staple');

    expect(firstHash).toStartWith('$argon2id$');
    expect(secondHash).toStartWith('$argon2id$');
    expect(firstHash).not.toBe(secondHash);
  });

  it('verifies the correct password and rejects a wrong password', async () => {
    const passwordHash = await hashPassword('a-secure-admin-password');

    expect(await verifyPassword(passwordHash, 'a-secure-admin-password')).toBe(
      true,
    );
    expect(await verifyPassword(passwordHash, 'wrong-password')).toBe(false);
  });

  it('rejects empty passwords and treats malformed hashes as invalid', async () => {
    await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    expect(await verifyPassword('not-an-argon2-hash', 'password')).toBe(false);
  });
});

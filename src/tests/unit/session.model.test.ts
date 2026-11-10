import { describe, expect, it } from 'bun:test';
import { Types } from 'mongoose';

import { SessionModel } from '../../modules/sessions/session.model.js';

const futureDate = (hours: number): Date =>
  new Date(Date.now() + hours * 60 * 60 * 1000);

const validSession = {
  userId: new Types.ObjectId(),
  refreshTokenHash: 'sha256-refresh-token-hash',
  tokenFamilyId: 'token-family-id',
  refreshTokenExpiresAt: futureDate(1),
  absoluteExpiresAt: futureDate(24),
};

describe('SessionModel', () => {
  it('applies safe session and revocation defaults', async () => {
    const session = new SessionModel(validSession);

    await session.validate();

    expect(session.rememberMe).toBe(false);
    expect(session.isRevoked).toBe(false);
    expect(session.lastRotatedAt).toBeInstanceOf(Date);
    expect(session.lastUsedAt).toBeInstanceOf(Date);
  });

  it('requires identity, token hash, family, and expiration fields', async () => {
    const session = new SessionModel({});

    await expect(session.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('excludes the refresh-token hash from default queries', () => {
    expect(SessionModel.schema.path('refreshTokenHash').options.select).toBe(
      false,
    );
  });

  it('defines token lookup, active-user, and expiration indexes', () => {
    const indexes = SessionModel.schema.indexes();
    const tokenIndex = indexes.find(
      ([fields]) => fields.refreshTokenHash === 1,
    );
    const activeUserIndex = indexes.find(
      ([fields]) =>
        fields.userId === 1 &&
        fields.isRevoked === 1 &&
        fields.absoluteExpiresAt === 1,
    );
    const ttlIndex = indexes.find(
      ([fields]) =>
        Object.keys(fields).length === 1 && fields.absoluteExpiresAt === 1,
    );

    expect(tokenIndex?.[1].unique).toBe(true);
    expect(activeUserIndex).toBeDefined();
    expect(ttlIndex?.[1].expireAfterSeconds).toBe(0);
  });
});

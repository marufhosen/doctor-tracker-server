import { describe, expect, it } from 'bun:test';
import { Types } from 'mongoose';

import { RefreshTokenHistoryModel } from '../../modules/sessions/refresh-token.model.js';

const validHistory = {
  sessionId: new Types.ObjectId(),
  tokenFamilyId: 'token-family-id',
  tokenHash: 'consumed-sha256-token-hash',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000),
};

describe('RefreshTokenHistoryModel', () => {
  it('records consumption time without retaining a raw token field', async () => {
    const history = new RefreshTokenHistoryModel(validHistory);

    await history.validate();

    expect(history.consumedAt).toBeInstanceOf(Date);
    expect(
      Object.hasOwn(RefreshTokenHistoryModel.schema.paths, 'rawToken'),
    ).toBe(false);
  });

  it('requires its session, family, hash, and expiration', async () => {
    const history = new RefreshTokenHistoryModel({});

    await expect(history.validate()).rejects.toMatchObject({
      name: 'ValidationError',
    });
  });

  it('excludes consumed token hashes from default queries', () => {
    expect(
      RefreshTokenHistoryModel.schema.path('tokenHash').options.select,
    ).toBe(false);
  });

  it('defines replay lookup and bounded-retention indexes', () => {
    const indexes = RefreshTokenHistoryModel.schema.indexes();
    const tokenIndex = indexes.find(([fields]) => fields.tokenHash === 1);
    const familyIndex = indexes.find(
      ([fields]) => fields.tokenFamilyId === 1 && fields.consumedAt === -1,
    );
    const ttlIndex = indexes.find(
      ([fields]) => Object.keys(fields).length === 1 && fields.expiresAt === 1,
    );

    expect(tokenIndex?.[1].unique).toBe(true);
    expect(familyIndex).toBeDefined();
    expect(ttlIndex?.[1].expireAfterSeconds).toBe(0);
  });
});

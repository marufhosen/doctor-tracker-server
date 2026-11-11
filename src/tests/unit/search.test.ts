import { describe, expect, it } from 'bun:test';

import { createPartialMatch } from '../../utils/search.js';

describe('createPartialMatch', () => {
  it('matches partial text without case sensitivity', () => {
    const match = createPartialMatch('CARD');

    expect(match.test('Pediatric cardiology')).toBe(true);
  });

  it('treats regular expression characters as literal input', () => {
    const match = createPartialMatch('City (North) + Care');

    expect(match.test('City (North) + Care Hospital')).toBe(true);
    expect(match.test('City North Care Hospital')).toBe(false);
  });
});

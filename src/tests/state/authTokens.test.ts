import { describe, expect, it } from 'vitest';
import {
  decodeJwtPayload,
  isTokenExpired,
} from '../../features/auth/authTokens';

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe('decodeJwtPayload', () => {
  it('decodes a well-formed token', () => {
    const token = makeToken({ sub: 'user-1', exp: 123 });

    expect(decodeJwtPayload(token)).toMatchObject({ sub: 'user-1', exp: 123 });
  });

  it('returns null for a token with the wrong number of segments', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
  });

  it('returns null when the payload segment is not valid base64/JSON', () => {
    expect(decodeJwtPayload('header.%%%not-base64%%%.sig')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('is false for a token whose exp is well in the future', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });

    expect(isTokenExpired(token)).toBe(false);
  });

  it('is true for a token whose exp is in the past', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) - 3600 });

    expect(isTokenExpired(token)).toBe(true);
  });

  it('applies the skew window near the expiry boundary', () => {
    const token = makeToken({ exp: Math.floor(Date.now() / 1000) + 10 });

    expect(isTokenExpired(token, 30)).toBe(true);
    expect(isTokenExpired(token, 0)).toBe(false);
  });

  it('treats an undecodable token as expired', () => {
    expect(isTokenExpired('garbage')).toBe(true);
  });
});

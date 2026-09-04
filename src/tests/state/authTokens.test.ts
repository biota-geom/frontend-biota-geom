import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  decodeJwtPayload,
  isTokenExpired,
} from '../../features/auth/authTokens';

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

/** A real JWT segment is base64url and unpadded — btoa alone produces neither. */
function makeBase64UrlToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
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

  it('returns null for a token with a fourth segment, even a decodable one', () => {
    expect(
      decodeJwtPayload(`${makeToken({ sub: 'user-1' })}.extra`)
    ).toBeNull();
  });

  it('translates the base64url alphabet back before decoding', () => {
    // '???>>>~~~' is what forces both a '-' (62) and a '_' (63) into the segment.
    const payload = { sub: 'user-1', exp: 123, note: '???>>>~~~' };
    const token = makeBase64UrlToken(payload);
    const segment = token.split('.')[1];

    expect(segment).toContain('-');
    expect(segment).toContain('_');
    expect(decodeJwtPayload(token)).toEqual(payload);
  });

  it('re-pads a segment whose length is not a multiple of four', () => {
    const payload = { sub: 'user-1', exp: 123, note: 'x?>~y' };
    const token = makeBase64UrlToken(payload);

    expect(token.split('.')[1].length % 4).toBe(3);
    expect(decodeJwtPayload(token)).toEqual(payload);
  });
});

describe('isTokenExpired', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it('counts a token as expired exactly when the skew window closes on it', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    const nowSeconds = Math.floor(Date.now() / 1000);
    const token = makeToken({ exp: nowSeconds + 30 });

    expect(isTokenExpired(token, 30)).toBe(true);
    expect(isTokenExpired(token, 29)).toBe(false);
  });
});

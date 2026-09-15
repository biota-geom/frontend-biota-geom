import { beforeEach, describe, expect, it } from 'vitest';
import { authStorage } from '../../features/auth/authStorage';

describe('authStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', () => {
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });

  it('stores and reads the access token independently', () => {
    authStorage.setAccessToken('access-1');

    expect(authStorage.getAccessToken()).toBe('access-1');
    expect(authStorage.getRefreshToken()).toBeNull();
  });

  it('stores and reads the refresh token independently', () => {
    authStorage.setRefreshToken('refresh-1');

    expect(authStorage.getRefreshToken()).toBe('refresh-1');
    expect(authStorage.getAccessToken()).toBeNull();
  });

  it('stores both tokens at once', () => {
    authStorage.setTokens('access-1', 'refresh-1');

    expect(authStorage.getAccessToken()).toBe('access-1');
    expect(authStorage.getRefreshToken()).toBe('refresh-1');
  });

  it('namespaces each token under its own storage key', () => {
    authStorage.setTokens('access-1', 'refresh-1');

    expect(localStorage.getItem('biota.auth.accessToken')).toBe('access-1');
    expect(localStorage.getItem('biota.auth.refreshToken')).toBe('refresh-1');
  });

  it('clears both tokens', () => {
    authStorage.setTokens('access-1', 'refresh-1');

    authStorage.clear();

    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });

  describe('last activity clock', () => {
    it('reads back nothing until an interaction is recorded', () => {
      expect(authStorage.getLastActivityAt()).toBeNull();
    });

    it('stores the timestamp as a number under its own key', () => {
      authStorage.setLastActivityAt(1767225600000);

      expect(authStorage.getLastActivityAt()).toBe(1767225600000);
      expect(localStorage.getItem('biota.auth.lastActivityAt')).toBe(
        '1767225600000'
      );
    });

    it('treats a value that is not a timestamp as no reading at all', () => {
      localStorage.setItem('biota.auth.lastActivityAt', 'tampered');

      expect(authStorage.getLastActivityAt()).toBeNull();
    });

    it('is cleared together with the tokens', () => {
      authStorage.setTokens('access-1', 'refresh-1');
      authStorage.setLastActivityAt(1767225600000);

      authStorage.clear();

      expect(authStorage.getLastActivityAt()).toBeNull();
    });
  });
});

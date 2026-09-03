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
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '../../features/auth/authStorage';
import { MOCK_AUTH_USER } from '../mocks/renderWithAuth';

vi.mock('../../services/api/authApi', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
}));

const authApi = await import('../../services/api/authApi');
const { useAuth } = await import('../../features/auth/useAuth');

function makeToken(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'none' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.sig`;
}

describe('useAuth store', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuth.setState({ user: null, status: 'idle' });
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('bootstrap', () => {
    it('goes straight to unauthenticated when there is no refresh token', async () => {
      await useAuth.getState().bootstrap();

      expect(useAuth.getState().status).toBe('unauthenticated');
      expect(authApi.refresh).not.toHaveBeenCalled();
    });

    it('clears storage and skips the network call when the refresh token is already expired', async () => {
      const expired = makeToken({ exp: Math.floor(Date.now() / 1000) - 60 });
      authStorage.setTokens('access', expired);

      await useAuth.getState().bootstrap();

      expect(useAuth.getState().status).toBe('unauthenticated');
      expect(authApi.refresh).not.toHaveBeenCalled();
      expect(authStorage.getRefreshToken()).toBeNull();
    });

    it('restores the session via /auth/refresh when the refresh token still looks valid', async () => {
      const valid = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
      authStorage.setTokens('old-access', valid);
      vi.mocked(authApi.refresh).mockResolvedValue({
        user: MOCK_AUTH_USER,
        accessToken: 'fresh-access',
      });

      await useAuth.getState().bootstrap();

      expect(useAuth.getState().status).toBe('authenticated');
      expect(useAuth.getState().user).toEqual(MOCK_AUTH_USER);
      expect(authStorage.getAccessToken()).toBe('fresh-access');
    });

    it('falls back to unauthenticated and clears storage when refresh fails', async () => {
      const valid = makeToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
      authStorage.setTokens('old-access', valid);
      vi.mocked(authApi.refresh).mockRejectedValue(new Error('dead token'));

      await useAuth.getState().bootstrap();

      expect(useAuth.getState().status).toBe('unauthenticated');
      expect(authStorage.getRefreshToken()).toBeNull();
    });

    it('is a no-op when called again after already resolving', async () => {
      await useAuth.getState().bootstrap();
      await useAuth.getState().bootstrap();

      expect(useAuth.getState().status).toBe('unauthenticated');
      expect(authApi.refresh).not.toHaveBeenCalled();
    });
  });

  describe('login / register / logout', () => {
    it('login persists both tokens and marks the store authenticated', async () => {
      vi.mocked(authApi.login).mockResolvedValue({
        user: MOCK_AUTH_USER,
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      });

      await useAuth.getState().login({ email: 'x@x.com', password: 'y' });

      expect(useAuth.getState().status).toBe('authenticated');
      expect(useAuth.getState().user).toEqual(MOCK_AUTH_USER);
      expect(authStorage.getAccessToken()).toBe('access-1');
      expect(authStorage.getRefreshToken()).toBe('refresh-1');
    });

    it('register behaves the same as login (auto-login)', async () => {
      vi.mocked(authApi.register).mockResolvedValue({
        user: MOCK_AUTH_USER,
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
      });

      await useAuth.getState().register({
        name: 'John Doe',
        email: 'x@x.com',
        password: 'y',
        passwordConfirmation: 'y',
      });

      expect(useAuth.getState().status).toBe('authenticated');
      expect(authStorage.getAccessToken()).toBe('access-1');
    });

    it('logout clears both tokens and resets the store', () => {
      authStorage.setTokens('access-1', 'refresh-1');
      useAuth.setState({ user: MOCK_AUTH_USER, status: 'authenticated' });

      useAuth.getState().logout();

      expect(useAuth.getState().status).toBe('unauthenticated');
      expect(useAuth.getState().user).toBeNull();
      expect(authStorage.getAccessToken()).toBeNull();
      expect(authStorage.getRefreshToken()).toBeNull();
    });
  });

  it('drops the store to unauthenticated when the API layer reports the session died', async () => {
    const { request } = await import('../../services/api/http');
    authStorage.setTokens('expired-access', 'dead-refresh-token');
    useAuth.setState({ user: MOCK_AUTH_USER, status: 'authenticated' });

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message: 'expired' }), { status: 401 })
    );

    await expect(request('/protected')).rejects.toBeDefined();

    expect(useAuth.getState().status).toBe('unauthenticated');
    expect(useAuth.getState().user).toBeNull();
  });
});

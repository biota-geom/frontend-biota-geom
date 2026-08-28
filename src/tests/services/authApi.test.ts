import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { login, register, refresh } = await import('../../services/api/authApi');

const USER_WIRE = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@biotageom.com.br',
  is_active: true,
  is_admin: false,
  created_at: '2026-01-01T00:00:00.000Z',
  last_login_at: null,
};

describe('authApi', () => {
  it('register() maps the request to snake_case and the response back to camelCase', async () => {
    vi.mocked(request).mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      token_type: 'Bearer',
      expires_in: 900,
      user: USER_WIRE,
    });

    const session = await register({
      name: 'John Doe',
      email: 'john.doe@biotageom.com.br',
      password: 'Sup3r$ecret!',
      passwordConfirmation: 'Sup3r$ecret!',
    });

    expect(request).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      requiresAuth: false,
      body: {
        name: 'John Doe',
        email: 'john.doe@biotageom.com.br',
        password: 'Sup3r$ecret!',
        password_confirmation: 'Sup3r$ecret!',
      },
    });
    expect(session).toEqual({
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@biotageom.com.br',
        isActive: true,
        isAdmin: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: null,
      },
      accessToken: 'access-1',
      refreshToken: 'refresh-1',
    });
  });

  it('login() sends snake_case and maps the response', async () => {
    vi.mocked(request).mockResolvedValue({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      token_type: 'Bearer',
      expires_in: 900,
      user: USER_WIRE,
    });

    const session = await login({
      email: 'john.doe@biotageom.com.br',
      password: 'Sup3r$ecret!',
    });

    expect(request).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      requiresAuth: false,
      body: { email: 'john.doe@biotageom.com.br', password: 'Sup3r$ecret!' },
    });
    expect(session.user.id).toBe('user-1');
    expect(session.refreshToken).toBe('refresh-1');
  });

  it('refresh() sends the refresh token and returns only the user + new access token', async () => {
    vi.mocked(request).mockResolvedValue({
      access_token: 'new-access',
      token_type: 'Bearer',
      expires_in: 900,
      user: USER_WIRE,
    });

    const result = await refresh('refresh-1');

    expect(request).toHaveBeenCalledWith('/auth/refresh', {
      method: 'POST',
      requiresAuth: false,
      skipAuthRefresh: true,
      body: { refresh_token: 'refresh-1' },
    });
    expect(result).toEqual({
      user: {
        id: 'user-1',
        name: 'John Doe',
        email: 'john.doe@biotageom.com.br',
        isActive: true,
        isAdmin: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: null,
      },
      accessToken: 'new-access',
    });
    expect(result).not.toHaveProperty('refreshToken');
  });
});

import type {
  AuthSession,
  AuthUser,
  LoginInput,
  RegisterInput,
} from '../../features/auth/types';
import { request } from './http';
import type { AuthResponseWire, RefreshResponseWire, UserWire } from './types';

function toAuthUser(wire: UserWire): AuthUser {
  return {
    id: wire.id,
    name: wire.name,
    email: wire.email,
    isActive: wire.is_active,
    isAdmin: wire.is_admin,
    createdAt: wire.created_at,
    lastLoginAt: wire.last_login_at,
  };
}

function toAuthSession(wire: AuthResponseWire): AuthSession {
  return {
    user: toAuthUser(wire.user),
    accessToken: wire.access_token,
    refreshToken: wire.refresh_token,
  };
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const wire = await request<AuthResponseWire>('/auth/register', {
    method: 'POST',
    requiresAuth: false,
    body: {
      name: input.name,
      email: input.email,
      password: input.password,
      password_confirmation: input.passwordConfirmation,
    },
  });

  return toAuthSession(wire);
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const wire = await request<AuthResponseWire>('/auth/login', {
    method: 'POST',
    requiresAuth: false,
    body: { email: input.email, password: input.password },
  });

  return toAuthSession(wire);
}

export async function refresh(
  refreshToken: string
): Promise<{ user: AuthUser; accessToken: string }> {
  const wire = await request<RefreshResponseWire>('/auth/refresh', {
    method: 'POST',
    requiresAuth: false,
    skipAuthRefresh: true,
    body: { refresh_token: refreshToken },
  });

  return { user: toAuthUser(wire.user), accessToken: wire.access_token };
}

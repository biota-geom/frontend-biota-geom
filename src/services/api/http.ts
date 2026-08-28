import { authStorage } from '../../features/auth/authStorage';
import { ApiError } from './apiError';
import { API_BASE_URL } from './config';
import type { ApiErrorWire, RefreshResponseWire } from './types';

const NETWORK_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão.';
const GENERIC_ERROR_MESSAGE =
  'Não foi possível concluir a operação. Tente novamente mais tarde.';
const SESSION_EXPIRED_MESSAGE = 'Sua sessão expirou. Faça login novamente.';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Attach the stored access token and allow the 401-refresh-retry flow. */
  requiresAuth?: boolean;
  /** Set on the retried call (and on the refresh call itself) to prevent recursion. */
  skipAuthRefresh?: boolean;
}

let unauthorizedHandler: (() => void) | null = null;

/** Registered once by the auth store so a dead session clears app state, not just storage. */
export function setUnauthorizedHandler(handler: () => void): void {
  unauthorizedHandler = handler;
}

let refreshPromise: Promise<void> | null = null;

function ensureRefreshed(): Promise<void> {
  refreshPromise ??= performRefresh().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function performRefresh(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new ApiError(401, SESSION_EXPIRED_MESSAGE);
  }

  const response = await request<RefreshResponseWire>('/auth/refresh', {
    method: 'POST',
    body: { refresh_token: refreshToken },
    requiresAuth: false,
    skipAuthRefresh: true,
  });

  authStorage.setAccessToken(response.access_token);
}

function isApiErrorWire(value: unknown): value is ApiErrorWire {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { message?: unknown }).message === 'string'
  );
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    method = 'GET',
    body,
    requiresAuth = true,
    skipAuthRefresh = false,
  } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (requiresAuth) {
    const accessToken = authStorage.getAccessToken();
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE, { isNetworkError: true });
  }

  if (response.status === 401 && requiresAuth && !skipAuthRefresh) {
    try {
      await ensureRefreshed();
    } catch {
      authStorage.clear();
      unauthorizedHandler?.();
      throw new ApiError(401, SESSION_EXPIRED_MESSAGE);
    }

    return request<T>(path, { ...options, skipAuthRefresh: true });
  }

  const payload = await parseBody(response);

  if (!response.ok) {
    const message = isApiErrorWire(payload)
      ? payload.message
      : GENERIC_ERROR_MESSAGE;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

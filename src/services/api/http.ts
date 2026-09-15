import { authStorage } from '../../features/auth/authStorage';
import type { AuthUser } from '../../features/auth/types';
import { ApiError } from './apiError';
/*
 * authApi.ts imports request() from this module, so this is a circular
 * import — it resolves cleanly because both request() and refresh() are
 * hoisted function declarations only ever called well after both modules
 * finish loading, never at module-evaluation time.
 */
import { refresh } from './authApi';
import { API_BASE_URL } from './config';
import type { ApiErrorWire } from './types';

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

let sessionRefreshedHandler: ((user: AuthUser) => void) | null = null;

/** Registered once by the auth store so a silent refresh's updated user (e.g. a role/permission change made server-side mid-session) reaches app state, not just the stored access token. */
export function setSessionRefreshedHandler(
  handler: (user: AuthUser) => void
): void {
  sessionRefreshedHandler = handler;
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

  const { user, accessToken } = await refresh(refreshToken);

  authStorage.setAccessToken(accessToken);
  sessionRefreshedHandler?.(user);
}

function isApiErrorWire(value: unknown): value is ApiErrorWire {
  if (typeof value !== 'object' || value === null) return false;

  /*
   * An array is as valid a `message` as a string: Nest's ValidationPipe answers
   * a rejected DTO with one entry per failed constraint, so every /customers
   * route reports its real reason ("Informe um CNPJ válido.") this way. Reading
   * only the string shape is what used to bury those behind the generic text.
   */
  const { message } = value as { message?: unknown };
  return typeof message === 'string' || Array.isArray(message);
}

/*
 * Null — never an empty string — when the payload carries nothing a user could
 * act on (an empty array, entries that aren't strings, blanks only), so the
 * caller falls back to GENERIC_ERROR_MESSAGE rather than raising a wordless
 * ApiError. The string shape is passed through untouched, empty included.
 *
 * Each constraint message is a whole sentence server-side, so joining several
 * with a space reads as one line instead of needing punctuation invented here.
 */
function toErrorMessage(message: string | string[]): string | null {
  if (typeof message === 'string') return message;

  const reasons = message
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');

  return reasons.length > 0 ? reasons.join(' ') : null;
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
    const message =
      (isApiErrorWire(payload) ? toErrorMessage(payload.message) : null) ??
      GENERIC_ERROR_MESSAGE;
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

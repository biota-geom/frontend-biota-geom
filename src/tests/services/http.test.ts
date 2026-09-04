import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authStorage } from '../../features/auth/authStorage';
import { ApiError } from '../../services/api/apiError';
import { request, setUnauthorizedHandler } from '../../services/api/http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function authHeaderOf(init: RequestInit | undefined): string | undefined {
  return (init?.headers as Record<string, string> | undefined)?.Authorization;
}

describe('http request()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    setUnauthorizedHandler(() => {});
  });

  it('attaches the Bearer token when an access token is stored', async () => {
    authStorage.setTokens('access-1', 'refresh-1');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, { ok: true }));

    await request('/protected');

    const [, init] = fetchMock.mock.calls[0]!;
    expect(authHeaderOf(init)).toBe('Bearer access-1');
  });

  it('does not attach a header when requiresAuth is false', async () => {
    authStorage.setTokens('access-1', 'refresh-1');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, {}));

    await request('/public', { requiresAuth: false });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(authHeaderOf(init)).toBeUndefined();
  });

  it('retries exactly once, with the new token, after a successful silent refresh on 401', async () => {
    authStorage.setTokens('expired-access', 'refresh-1');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'new-access',
          token_type: 'Bearer',
          expires_in: 900,
          user: {},
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { data: 'secret' }));

    const result = await request<{ data: string }>('/protected');

    expect(result).toEqual({ data: 'secret' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(authStorage.getAccessToken()).toBe('new-access');
    expect(authHeaderOf(fetchMock.mock.calls[2]![1])).toBe('Bearer new-access');
  });

  it('coalesces concurrent 401s into a single refresh call', async () => {
    authStorage.setTokens('expired-access', 'refresh-1');
    let refreshCallCount = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      const path = String(input);
      if (path.includes('/auth/refresh')) {
        refreshCallCount += 1;
        return Promise.resolve(
          jsonResponse(200, {
            access_token: 'new-access',
            token_type: 'Bearer',
            expires_in: 900,
            user: {},
          })
        );
      }
      if (authHeaderOf(init) === 'Bearer new-access') {
        return Promise.resolve(jsonResponse(200, { ok: true }));
      }
      return Promise.resolve(jsonResponse(401, { message: 'expired' }));
    });

    await Promise.all([request('/a'), request('/b')]);

    expect(refreshCallCount).toBe(1);
  });

  it('clears storage and calls the unauthorized handler when the refresh call itself fails', async () => {
    authStorage.setTokens('expired-access', 'refresh-1');
    const handler = vi.fn();
    setUnauthorizedHandler(handler);

    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      const path = String(input);
      const status = path.includes('/auth/refresh') ? 401 : 401;
      return Promise.resolve(
        jsonResponse(status, { message: 'Sua sessão expirou.' })
      );
    });

    await expect(request('/protected')).rejects.toMatchObject({
      status: 401,
      message: 'Sua sessão expirou. Faça login novamente.',
    });
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('fails without a network call for refresh when there is no refresh token stored', async () => {
    authStorage.setAccessToken('expired-access');
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(401, { message: 'expired' }));

    await expect(request('/protected')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('wraps a fetch rejection as a network ApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    const error = await request('/x', { requiresAuth: false }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).isNetworkError).toBe(true);
  });

  it('throws an ApiError carrying the exact server message on a non-2xx response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(400, {
        statusCode: 400,
        message: 'A senha não atende aos requisitos mínimos de segurança.',
        error: 'Bad Request',
      })
    );

    const error = await request('/x', { requiresAuth: false }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).message).toBe(
      'A senha não atende aos requisitos mínimos de segurança.'
    );
  });

  it('falls back to a generic message when the error body carries none', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('not json', { status: 500 })
    );

    const error = await request('/x', { requiresAuth: false }).catch(
      (caught: unknown) => caught
    );

    expect((error as ApiError).status).toBe(500);
    expect((error as ApiError).message).toBe(
      'Não foi possível concluir a operação. Tente novamente mais tarde.'
    );
  });

  it('defaults to GET and always sends a JSON content type', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, {}));

    await request('/x', { requiresAuth: false });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init?.method).toBe('GET');
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe(
      'application/json'
    );
  });

  it('omits the Authorization header when auth is required but nothing is stored', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(jsonResponse(200, {}));

    await request('/protected');

    expect(authHeaderOf(fetchMock.mock.calls[0]![1])).toBeUndefined();
  });

  it('serializes the body as JSON, and sends none when there is no body', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(() => Promise.resolve(jsonResponse(200, {})));

    await request('/x', {
      requiresAuth: false,
      method: 'POST',
      body: { email: 'john.doe@biotageom.com.br' },
    });
    await request('/x', { requiresAuth: false });

    expect(fetchMock.mock.calls[0]![1]?.body).toBe(
      '{"email":"john.doe@biotageom.com.br"}'
    );
    expect(fetchMock.mock.calls[1]![1]?.body).toBeUndefined();
  });

  it('replays the original method and body on the post-refresh retry', async () => {
    authStorage.setTokens('expired-access', 'refresh-1');
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(jsonResponse(401, { message: 'expired' }))
      .mockResolvedValueOnce(
        jsonResponse(200, {
          access_token: 'new-access',
          token_type: 'Bearer',
          expires_in: 900,
          user: {},
        })
      )
      .mockResolvedValueOnce(jsonResponse(200, { ok: true }));

    await request('/protected', { method: 'POST', body: { name: 'Biota' } });

    const [, retryInit] = fetchMock.mock.calls[2]!;
    expect(retryInit?.method).toBe('POST');
    expect(retryInit?.body).toBe('{"name":"Biota"}');
  });

  it('gives up instead of refreshing again when the retried request is still unauthorized', async () => {
    authStorage.setTokens('expired-access', 'refresh-1');
    let protectedCalls = 0;

    vi.spyOn(globalThis, 'fetch').mockImplementation((input) => {
      if (String(input).includes('/auth/refresh')) {
        return Promise.resolve(
          jsonResponse(200, {
            access_token: 'new-access',
            token_type: 'Bearer',
            expires_in: 900,
            user: {},
          })
        );
      }

      protectedCalls += 1;
      return Promise.resolve(
        protectedCalls <= 2
          ? jsonResponse(401, { message: 'ainda expirado' })
          : jsonResponse(200, { ok: true })
      );
    });

    await expect(request('/protected')).rejects.toMatchObject({
      status: 401,
      message: 'ainda expirado',
    });
    expect(protectedCalls).toBe(2);
  });

  it('reports the offline message verbatim when fetch itself fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(
      new TypeError('Failed to fetch')
    );

    const error = await request('/x', { requiresAuth: false }).catch(
      (caught: unknown) => caught
    );

    expect((error as ApiError).message).toBe(
      'Não foi possível conectar ao servidor. Verifique sua conexão.'
    );
  });

  it('falls back to the generic message when the error payload is null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('null', { status: 500 })
    );

    const error = await request('/x', { requiresAuth: false }).catch(
      (caught: unknown) => caught
    );

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toBe(
      'Não foi possível concluir a operação. Tente novamente mais tarde.'
    );
  });

  it('falls back to the generic message when the error payload carries no message field', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse(422, { statusCode: 422, error: 'Unprocessable Entity' })
    );

    const error = await request('/x', { requiresAuth: false }).catch(
      (caught: unknown) => caught
    );

    expect((error as ApiError).message).toBe(
      'Não foi possível concluir a operação. Tente novamente mais tarde.'
    );
  });
});

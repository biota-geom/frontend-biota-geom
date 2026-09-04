import { afterEach, describe, expect, it, vi } from 'vitest';

/*
 * config.ts reads import.meta.env at module scope, so each case has to drop the
 * module registry and re-import it after stubbing the variable.
 */
async function loadApiBaseUrl(): Promise<string> {
  vi.resetModules();
  const { API_BASE_URL } = await import('../../services/api/config');

  return API_BASE_URL;
}

describe('API_BASE_URL', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses VITE_API_BASE_URL when the build provides one', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.biotageom.com.br');

    await expect(loadApiBaseUrl()).resolves.toBe(
      'https://api.biotageom.com.br'
    );
  });

  it('falls back to the local backend when the variable is unset', async () => {
    vi.stubEnv('VITE_API_BASE_URL', undefined);

    await expect(loadApiBaseUrl()).resolves.toBe('http://localhost:3000');
  });
});

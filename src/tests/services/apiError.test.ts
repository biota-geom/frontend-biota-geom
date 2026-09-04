import { describe, expect, it } from 'vitest';
import { ApiError } from '../../services/api/apiError';

describe('ApiError', () => {
  it('is a named Error carrying the HTTP status and the server message', () => {
    const error = new ApiError(404, 'Recurso não encontrado.');

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Recurso não encontrado.');
  });

  it('is not a network error unless explicitly flagged as one', () => {
    expect(new ApiError(500, 'falhou').isNetworkError).toBe(false);
    expect(
      new ApiError(0, 'offline', { isNetworkError: true }).isNetworkError
    ).toBe(true);
  });
});

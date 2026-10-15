import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/licensesApi', () => ({
  getLicenseDocumentUrl: vi.fn(),
}));

const licensesApi = await import('../../services/api/licensesApi');
const { LICENSE_DOCUMENT_MESSAGES, useOpenLicenseDocument } =
  await import('../../features/licenses/useOpenLicenseDocument');

const SIGNED_URL =
  'https://bucket.s3.amazonaws.com/licenses/c-1/doc.pdf?X-Amz-Expires=900&X-Amz-Signature=abc';

function deferred<T>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useOpenLicenseDocument', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(window, 'open').mockReturnValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens the signed URL in a new tab and tracks the license being opened', async () => {
    const pending = deferred<{ url: string; expiresIn: number }>();
    vi.mocked(licensesApi.getLicenseDocumentUrl).mockReturnValue(
      pending.promise
    );
    const { result } = renderHook(() => useOpenLicenseDocument());

    let opening: Promise<void> = Promise.resolve();
    act(() => {
      opening = result.current.openDocument('license-1');
    });
    expect(result.current.openingLicenseId).toBe('license-1');

    await act(async () => {
      pending.resolve({ url: SIGNED_URL, expiresIn: 900 });
      await opening;
    });

    expect(licensesApi.getLicenseDocumentUrl).toHaveBeenCalledWith('license-1');
    expect(window.open).toHaveBeenCalledWith(
      SIGNED_URL,
      '_blank',
      'noopener,noreferrer'
    );
    expect(result.current.openingLicenseId).toBeNull();
    expect(result.current.errorMessage).toBeNull();
  });

  it('ignores a second call fired before the first one settles', async () => {
    const pending = deferred<{ url: string; expiresIn: number }>();
    vi.mocked(licensesApi.getLicenseDocumentUrl).mockReturnValue(
      pending.promise
    );
    const { result } = renderHook(() => useOpenLicenseDocument());

    await act(async () => {
      // Same render: the second call must be blocked without a re-render.
      const first = result.current.openDocument('license-1');
      const second = result.current.openDocument('license-2');
      pending.resolve({ url: SIGNED_URL, expiresIn: 900 });
      await Promise.all([first, second]);
    });

    expect(licensesApi.getLicenseDocumentUrl).toHaveBeenCalledTimes(1);
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it('accepts a new request once the previous one has settled', async () => {
    vi.mocked(licensesApi.getLicenseDocumentUrl)
      .mockRejectedValueOnce(new ApiError(500, 'boom'))
      .mockResolvedValueOnce({ url: SIGNED_URL, expiresIn: 900 });
    const { result } = renderHook(() => useOpenLicenseDocument());

    await act(() => result.current.openDocument('license-1'));
    await act(() => result.current.openDocument('license-1'));

    expect(licensesApi.getLicenseDocumentUrl).toHaveBeenCalledTimes(2);
    expect(window.open).toHaveBeenCalledTimes(1);
  });

  it.each([
    [new ApiError(404, 'Licença não encontrada.'), 'NOT_FOUND'],
    [new ApiError(403, 'Forbidden'), 'FORBIDDEN'],
    [new ApiError(500, 'Internal'), 'GENERIC'],
    [new ApiError(0, 'offline', { isNetworkError: true }), 'GENERIC'],
    [new Error('unexpected'), 'GENERIC'],
  ] as const)(
    'maps %o to the %s message without opening a tab',
    async (error, key) => {
      vi.mocked(licensesApi.getLicenseDocumentUrl).mockRejectedValue(error);
      const { result } = renderHook(() => useOpenLicenseDocument());

      await act(() => result.current.openDocument('license-1'));

      expect(result.current.errorMessage).toBe(LICENSE_DOCUMENT_MESSAGES[key]);
      expect(result.current.openingLicenseId).toBeNull();
      expect(window.open).not.toHaveBeenCalled();
    }
  );

  it('clears a previous error as soon as a new attempt starts', async () => {
    const retry = deferred<{ url: string; expiresIn: number }>();
    vi.mocked(licensesApi.getLicenseDocumentUrl)
      .mockRejectedValueOnce(new ApiError(404, 'x'))
      .mockReturnValueOnce(retry.promise);
    const { result } = renderHook(() => useOpenLicenseDocument());

    await act(() => result.current.openDocument('license-1'));
    expect(result.current.errorMessage).toBe(
      LICENSE_DOCUMENT_MESSAGES.NOT_FOUND
    );

    let opening: Promise<void> = Promise.resolve();
    act(() => {
      opening = result.current.openDocument('license-1');
    });
    expect(result.current.errorMessage).toBeNull();

    await act(async () => {
      retry.resolve({ url: SIGNED_URL, expiresIn: 900 });
      await opening;
    });
  });

  it('dismissError() clears the error message', async () => {
    vi.mocked(licensesApi.getLicenseDocumentUrl).mockRejectedValue(
      new ApiError(403, 'x')
    );
    const { result } = renderHook(() => useOpenLicenseDocument());

    await act(() => result.current.openDocument('license-1'));
    act(() => result.current.dismissError());

    await waitFor(() => expect(result.current.errorMessage).toBeNull());
  });

  it('keeps stable callbacks across re-renders', () => {
    const { result, rerender } = renderHook(() => useOpenLicenseDocument());
    const { openDocument, dismissError } = result.current;

    rerender();

    expect(result.current.openDocument).toBe(openDocument);
    expect(result.current.dismissError).toBe(dismissError);
  });
});

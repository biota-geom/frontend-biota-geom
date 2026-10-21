import { afterEach, describe, expect, it, vi } from 'vitest';
import { openProtectedFile } from '../../utils/openProtectedFile';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('openProtectedFile', () => {
  it('opens a tab synchronously and navigates it after loading the URL', async () => {
    const replace = vi.fn();
    const tab = {
      close: vi.fn(),
      location: { replace },
      opener: window,
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(tab);

    await expect(
      openProtectedFile(() =>
        Promise.resolve('https://signed.example/document.pdf')
      )
    ).resolves.toBe('opened');

    expect(window.open).toHaveBeenCalledWith('about:blank', '_blank');
    expect(tab.opener).toBeNull();
    expect(replace).toHaveBeenCalledWith('https://signed.example/document.pdf');
  });

  it('reports a blocked popup without requesting a URL', async () => {
    const loadUrl = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue(null);

    await expect(openProtectedFile(loadUrl)).resolves.toBe('popup-blocked');
    expect(loadUrl).not.toHaveBeenCalled();
  });

  it('closes the placeholder tab when loading the URL fails', async () => {
    const tab = {
      close: vi.fn(),
      location: { replace: vi.fn() },
      opener: window,
    } as unknown as Window;
    vi.spyOn(window, 'open').mockReturnValue(tab);

    await expect(
      openProtectedFile(() => Promise.reject(new Error('failed')))
    ).rejects.toThrow('failed');
    expect(tab.close).toHaveBeenCalled();
  });
});

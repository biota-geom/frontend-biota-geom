import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { saveBlobAs } from '../../utils/saveBlobAs';

const OBJECT_URL = 'blob:report';

describe('saveBlobAs', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn().mockReturnValue(OBJECT_URL);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('clicks a detached anchor carrying the blob and the given name', () => {
    const click = vi.fn();
    const createElement = window.document.createElement.bind(window.document);
    let anchor: HTMLAnchorElement | null = null;

    vi.spyOn(window.document, 'createElement').mockImplementation(
      (tagName: string, options?: ElementCreationOptions) => {
        const element = createElement(tagName, options);
        if (tagName === 'a') {
          element.click = click;
          anchor = element as HTMLAnchorElement;
        }
        return element;
      }
    );

    const blob = new Blob(['%PDF-1.7'], { type: 'application/pdf' });
    saveBlobAs(blob, 'relatorio-empresa-2026-10-28.pdf');

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledTimes(1);
    expect(anchor!.download).toBe('relatorio-empresa-2026-10-28.pdf');
    expect(anchor!.href).toBe(OBJECT_URL);
    // The anchor is never attached, so nothing is left behind in the page.
    expect(window.document.body.contains(anchor)).toBe(false);
  });

  it('releases the object URL after the click', () => {
    vi.spyOn(window.document, 'createElement').mockReturnValue({
      click: vi.fn(),
    } as unknown as HTMLElement);

    saveBlobAs(new Blob(['x']), 'arquivo.pdf');

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });
});

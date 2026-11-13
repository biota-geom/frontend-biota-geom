import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseLegislation } from '../../features/legislation/types';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/legislationsApi', () => ({
  getLicenseLegislations: vi.fn(),
}));

const { getLicenseLegislations } =
  await import('../../services/api/legislationsApi');
const { useLicenseLegislations } =
  await import('../../features/legislation/useLicenseLegislations');

const ITEM: LicenseLegislation = {
  id: 'link-1',
  legislation: {
    id: 'legislation-1',
    type: 'LEI',
    number: '12.305',
    year: 2010,
    issuingBody: 'Governo Federal',
    summary: null,
  },
  source: 'MANUAL',
  citedExcerpt: null,
  impact: null,
  technicalAnalysis: null,
  readAt: null,
  createdAt: '2026-11-02T12:00:00.000Z',
};

describe('useLicenseLegislations', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('stays idle without a license id', () => {
    const { result } = renderHook(() => useLicenseLegislations(undefined));

    expect(result.current.status).toBe('idle');
    expect(getLicenseLegislations).not.toHaveBeenCalled();
  });

  it('loads the license radar', async () => {
    vi.mocked(getLicenseLegislations).mockResolvedValue([ITEM]);

    const { result } = renderHook(() => useLicenseLegislations('license-1'));

    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.legislations).toEqual([ITEM]);
    expect(getLicenseLegislations).toHaveBeenCalledWith('license-1', {});
  });

  it('exposes the API error message', async () => {
    vi.mocked(getLicenseLegislations).mockRejectedValue(
      new ApiError(404, 'Licença não encontrada.')
    );

    const { result } = renderHook(() => useLicenseLegislations('license-1'));

    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Licença não encontrada.');
    expect(result.current.legislations).toEqual([]);
  });

  it('falls back to a generic message for unexpected failures', async () => {
    vi.mocked(getLicenseLegislations).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useLicenseLegislations('license-1'));

    await waitFor(() =>
      expect(result.current.error).toBe(
        'Não foi possível carregar o radar de legislação.'
      )
    );
  });

  it('reloads the radar on refetch', async () => {
    vi.mocked(getLicenseLegislations)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([ITEM]);

    const { result } = renderHook(() => useLicenseLegislations('license-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.legislations).toEqual([ITEM]));
    expect(getLicenseLegislations).toHaveBeenCalledTimes(2);
  });

  it('loads only the chosen impact level and reloads when it changes', async () => {
    vi.mocked(getLicenseLegislations).mockResolvedValue([]);

    const { result, rerender } = renderHook(
      ({ impact }: { impact: 'HIGH' | null }) =>
        useLicenseLegislations('license-1', impact),
      { initialProps: { impact: 'HIGH' as 'HIGH' | null } }
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(getLicenseLegislations).toHaveBeenLastCalledWith('license-1', {
      impact: 'HIGH',
    });

    rerender({ impact: null });

    await waitFor(() =>
      expect(getLicenseLegislations).toHaveBeenLastCalledWith('license-1', {})
    );
  });

  it('patches an entry in place without reloading', async () => {
    vi.mocked(getLicenseLegislations).mockResolvedValue([
      ITEM,
      { ...ITEM, id: 'link-2' },
    ]);
    const { result } = renderHook(() => useLicenseLegislations('license-1'));
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() =>
      result.current.patchLegislation('link-1', {
        impact: 'LOW',
        readAt: '2026-11-12T15:00:00.000Z',
      })
    );

    expect(result.current.legislations).toEqual([
      { ...ITEM, impact: 'LOW', readAt: '2026-11-12T15:00:00.000Z' },
      { ...ITEM, id: 'link-2' },
    ]);
    expect(result.current.status).toBe('success');
    expect(getLicenseLegislations).toHaveBeenCalledTimes(1);
  });

  it('keeps an entry that still matches the active filter', async () => {
    vi.mocked(getLicenseLegislations).mockResolvedValue([
      { ...ITEM, impact: 'HIGH' },
    ]);
    const { result } = renderHook(() =>
      useLicenseLegislations('license-1', 'HIGH')
    );
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() =>
      result.current.patchLegislation('link-1', {
        readAt: '2026-11-12T15:00:00.000Z',
      })
    );

    expect(result.current.legislations).toHaveLength(1);
    expect(result.current.legislations[0].impact).toBe('HIGH');
  });

  it('drops an entry that no longer matches the active filter', async () => {
    vi.mocked(getLicenseLegislations).mockResolvedValue([
      { ...ITEM, impact: 'HIGH' },
      { ...ITEM, id: 'link-2', impact: 'HIGH' },
    ]);
    const { result } = renderHook(() =>
      useLicenseLegislations('license-1', 'HIGH')
    );
    await waitFor(() => expect(result.current.status).toBe('success'));

    act(() => result.current.patchLegislation('link-1', { impact: 'LOW' }));

    expect(result.current.legislations.map((item) => item.id)).toEqual([
      'link-2',
    ]);
  });

  it('ignores a response that arrives after the license changed', async () => {
    let resolveFirst: (value: LicenseLegislation[]) => void = () => {};
    vi.mocked(getLicenseLegislations)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
      )
      .mockResolvedValueOnce([]);

    const { result, rerender } = renderHook(
      ({ id }) => useLicenseLegislations(id),
      { initialProps: { id: 'license-1' } }
    );
    rerender({ id: 'license-2' });
    await waitFor(() => expect(result.current.status).toBe('success'));

    await act(async () => resolveFirst([ITEM]));

    expect(result.current.legislations).toEqual([]);
  });
});

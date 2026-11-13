import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LicenseLegislation } from '../../features/legislation/types';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/legislationsApi', () => ({
  updateLicenseLegislation: vi.fn(),
}));

const { updateLicenseLegislation } =
  await import('../../services/api/legislationsApi');
const { useLegislationUpdates } =
  await import('../../features/legislation/useLegislationUpdates');

const UPDATED = {
  id: 'link-1',
  impact: 'HIGH',
  readAt: '2026-11-12T15:00:00.000Z',
} as LicenseLegislation;

describe('useLegislationUpdates', () => {
  const onPatched = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('does nothing without a license id', async () => {
    const { result } = renderHook(() =>
      useLegislationUpdates(undefined, onPatched)
    );

    await act(async () => {
      await result.current.changeImpact('link-1', 'HIGH');
      await result.current.markAsRead('link-1');
    });

    expect(updateLicenseLegislation).not.toHaveBeenCalled();
    expect(onPatched).not.toHaveBeenCalled();
  });

  it('saves the impact and reports only that field', async () => {
    vi.mocked(updateLicenseLegislation).mockResolvedValue(UPDATED);
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.changeImpact('link-1', 'HIGH'));

    expect(updateLicenseLegislation).toHaveBeenCalledWith(
      'license-1',
      'link-1',
      { impact: 'HIGH' }
    );
    expect(onPatched).toHaveBeenCalledWith('link-1', { impact: 'HIGH' });
    expect(result.current.error).toBeNull();
  });

  it('clears the impact with null', async () => {
    vi.mocked(updateLicenseLegislation).mockResolvedValue({
      ...UPDATED,
      impact: null,
    });
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.changeImpact('link-1', null));

    expect(updateLicenseLegislation).toHaveBeenCalledWith(
      'license-1',
      'link-1',
      { impact: null }
    );
    expect(onPatched).toHaveBeenCalledWith('link-1', { impact: null });
  });

  it('marks the entry as saving while the request is in flight', async () => {
    let resolveRequest: (value: LicenseLegislation) => void = () => {};
    vi.mocked(updateLicenseLegislation).mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    act(() => {
      void result.current.changeImpact('link-1', 'HIGH');
    });
    await waitFor(() =>
      expect(result.current.savingIds.has('link-1')).toBe(true)
    );
    expect(result.current.savingIds.has('link-2')).toBe(false);

    await act(async () => resolveRequest(UPDATED));

    expect(result.current.savingIds.size).toBe(0);
  });

  it('exposes the API error message and lets it be dismissed', async () => {
    vi.mocked(updateLicenseLegislation).mockRejectedValue(
      new ApiError(404, 'Legislação não encontrada nesta licença.')
    );
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.changeImpact('link-1', 'HIGH'));

    expect(result.current.error).toBe(
      'Legislação não encontrada nesta licença.'
    );
    expect(result.current.savingIds.size).toBe(0);
    expect(onPatched).not.toHaveBeenCalled();

    act(() => result.current.clearError());
    expect(result.current.error).toBeNull();
  });

  it('falls back to a generic message for unexpected failures', async () => {
    vi.mocked(updateLicenseLegislation).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.changeImpact('link-1', 'LOW'));

    expect(result.current.error).toBe(
      'Não foi possível alterar o impacto da legislação.'
    );
  });

  it('clears a previous error when a new change starts', async () => {
    vi.mocked(updateLicenseLegislation)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce(UPDATED);
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.changeImpact('link-1', 'HIGH'));
    expect(result.current.error).not.toBeNull();

    await act(() => result.current.changeImpact('link-1', 'HIGH'));
    expect(result.current.error).toBeNull();
  });

  it('marks as read and reports only readAt', async () => {
    vi.mocked(updateLicenseLegislation).mockResolvedValue(UPDATED);
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.markAsRead('link-1'));

    expect(updateLicenseLegislation).toHaveBeenCalledWith(
      'license-1',
      'link-1',
      { read: true }
    );
    expect(onPatched).toHaveBeenCalledWith('link-1', {
      readAt: '2026-11-12T15:00:00.000Z',
    });
  });

  it('keeps a failed mark-as-read silent', async () => {
    vi.mocked(updateLicenseLegislation).mockRejectedValue(new Error('network'));
    const { result } = renderHook(() =>
      useLegislationUpdates('license-1', onPatched)
    );

    await act(() => result.current.markAsRead('link-1'));

    expect(result.current.error).toBeNull();
    expect(onPatched).not.toHaveBeenCalled();
  });

  it('follows the current license and callback after a rerender', async () => {
    vi.mocked(updateLicenseLegislation).mockResolvedValue(UPDATED);
    const firstPatched = vi.fn();
    const secondPatched = vi.fn();
    const { result, rerender } = renderHook(
      ({ licenseId, onPatched: handler }) =>
        useLegislationUpdates(licenseId, handler),
      { initialProps: { licenseId: 'license-1', onPatched: firstPatched } }
    );

    rerender({ licenseId: 'license-2', onPatched: secondPatched });
    await act(() => result.current.changeImpact('link-1', 'HIGH'));
    await act(() => result.current.markAsRead('link-1'));

    expect(updateLicenseLegislation).toHaveBeenNthCalledWith(
      1,
      'license-2',
      'link-1',
      { impact: 'HIGH' }
    );
    expect(updateLicenseLegislation).toHaveBeenNthCalledWith(
      2,
      'license-2',
      'link-1',
      { read: true }
    );
    expect(firstPatched).not.toHaveBeenCalled();
    expect(secondPatched).toHaveBeenCalledTimes(2);
  });
});

import { act, cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertsProvider } from '../../features/alerts/AlertsProvider';
import { useAlerts } from '../../features/alerts/useAlerts';
import type { AlertsPage } from '../../features/alerts/types';
import { useAuth } from '../../features/auth/useAuth';
import { ApiError } from '../../services/api/apiError';
import { MOCK_AUTH_USER, seedAuthState } from '../mocks/renderWithAuth';

vi.mock('../../services/api/alertsApi', () => ({
  getUnreadAlertsCount: vi.fn(),
  listAlerts: vi.fn(),
}));
const { getUnreadAlertsCount, listAlerts } =
  await import('../../services/api/alertsApi');

const MOCK_PAGE: AlertsPage = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function wrapper({ children }: { children: ReactNode }) {
  return <AlertsProvider>{children}</AlertsProvider>;
}

async function settle() {
  await act(async () => {
    await Promise.resolve();
  });
}

describe('useAlerts', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetAllMocks();
    seedAuthState({ status: 'authenticated', user: MOCK_AUTH_USER });
    vi.mocked(getUnreadAlertsCount).mockResolvedValue(3);
    vi.mocked(listAlerts).mockResolvedValue(MOCK_PAGE);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('requires the shared provider', () => {
    expect(() => renderHook(useAlerts)).toThrow(
      'useAlerts must be used within AlertsProvider'
    );
  });

  it('loads the count initially and fetches the list only when opened', async () => {
    const { result } = renderHook(useAlerts, { wrapper });
    expect(result.current.unreadCount).toBeNull();
    expect(result.current.countStatus).toBe('loading');
    expect(result.current.listStatus).toBe('idle');
    await settle();
    expect(result.current.unreadCount).toBe(3);
    expect(result.current.countStatus).toBe('success');
    expect(listAlerts).not.toHaveBeenCalled();

    act(() => result.current.setOpen(true));
    expect(result.current.isOpen).toBe(true);
    expect(result.current.listStatus).toBe('loading');
    await settle();
    expect(result.current.alerts).toEqual(MOCK_PAGE);
    expect(result.current.listStatus).toBe('success');
    act(() => result.current.setOpen(true));
    expect(listAlerts).toHaveBeenCalledTimes(1);
  });

  it('polls every 60 seconds and only refreshes an open list', async () => {
    const { result } = renderHook(useAlerts, { wrapper });
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(59_999);
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(2);
    expect(listAlerts).not.toHaveBeenCalled();
    act(() => result.current.setOpen(true));
    await settle();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(listAlerts).toHaveBeenCalledTimes(2);
    act(() => result.current.setOpen(false));
    expect(result.current.isOpen).toBe(false);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(listAlerts).toHaveBeenCalledTimes(2);
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(4);
  });

  it('refreshes on focus and when the tab becomes visible', async () => {
    renderHook(useAlerts, { wrapper });
    await settle();
    act(() => window.dispatchEvent(new Event('focus')));
    await settle();
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(2);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(2);
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    await settle();
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(3);
  });

  it('coalesces overlapping automatic requests', async () => {
    const count = deferred<number>();
    vi.mocked(getUnreadAlertsCount).mockReturnValue(count.promise);
    renderHook(useAlerts, { wrapper });
    act(() => {
      window.dispatchEvent(new Event('focus'));
      vi.advanceTimersByTime(120_000);
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
    await act(async () => count.resolve(5));
  });

  it('explicit refresh reads again after an older request and coalesces callers', async () => {
    const oldCount = deferred<number>();
    vi.mocked(getUnreadAlertsCount)
      .mockReturnValueOnce(oldCount.promise)
      .mockResolvedValue(2);
    const { result } = renderHook(useAlerts, { wrapper });
    let refresh!: Promise<void>;
    act(() => {
      refresh = result.current.refreshAlerts();
      expect(result.current.refreshAlerts()).toBe(refresh);
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
    await act(async () => {
      oldCount.resolve(3);
      await refresh;
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(2);
    expect(result.current.unreadCount).toBe(2);
    expect(listAlerts).not.toHaveBeenCalled();
  });

  it('refreshes an open list and reloads a closed list on next opening', async () => {
    const { result } = renderHook(useAlerts, { wrapper });
    await settle();
    act(() => result.current.setOpen(true));
    await settle();
    await act(async () => result.current.refreshAlerts());
    expect(listAlerts).toHaveBeenCalledTimes(2);
    act(() => result.current.setOpen(false));
    await act(async () => result.current.refreshAlerts());
    expect(listAlerts).toHaveBeenCalledTimes(2);
    act(() => result.current.setOpen(true));
    await settle();
    expect(listAlerts).toHaveBeenCalledTimes(3);
  });

  it('reopening waits for an outdated list and requests fresh data', async () => {
    const oldList = deferred<AlertsPage>();
    vi.mocked(listAlerts)
      .mockReturnValueOnce(oldList.promise)
      .mockResolvedValue(MOCK_PAGE);
    const { result } = renderHook(useAlerts, { wrapper });
    await settle();
    act(() => result.current.setOpen(true));
    act(() => result.current.setOpen(false));
    await act(async () => result.current.refreshAlerts());
    act(() => result.current.setOpen(true));
    expect(listAlerts).toHaveBeenCalledTimes(1);
    await act(async () => oldList.resolve({ ...MOCK_PAGE, total: 99 }));
    expect(listAlerts).toHaveBeenCalledTimes(2);
    expect(result.current.alerts).toEqual(MOCK_PAGE);
  });

  it('does not restart a queued refresh after its session ends', async () => {
    const oldCount = deferred<number>();
    vi.mocked(getUnreadAlertsCount).mockReturnValueOnce(oldCount.promise);
    const { result, unmount } = renderHook(useAlerts, { wrapper });
    let refresh!: Promise<void>;
    act(() => {
      refresh = result.current.refreshAlerts();
    });
    unmount();
    await act(async () => {
      oldCount.reject(new Error('offline'));
      await refresh;
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
  });

  it('keeps successful data on refresh failure and retries independently', async () => {
    const { result } = renderHook(useAlerts, { wrapper });
    await settle();
    act(() => result.current.setOpen(true));
    await settle();
    vi.mocked(getUnreadAlertsCount).mockRejectedValueOnce(
      new ApiError(500, 'Falha no contador.')
    );
    await act(async () => result.current.refreshAlerts());
    expect(result.current.unreadCount).toBe(3);
    expect(result.current.countStatus).toBe('error');
    expect(result.current.countError).toBe('Falha no contador.');
    expect(result.current.listStatus).toBe('success');
    vi.mocked(listAlerts).mockRejectedValueOnce(new Error('offline'));
    await act(async () => result.current.refreshAlerts());
    expect(result.current.countError).toBeNull();
    expect(result.current.countStatus).toBe('success');
    expect(result.current.alerts).toEqual(MOCK_PAGE);
    expect(result.current.listStatus).toBe('error');
    expect(result.current.listError).toBe(
      'Não foi possível carregar as notificações.'
    );
    await act(async () => result.current.refreshAlerts());
    expect(result.current.listError).toBeNull();
  });

  it('distinguishes an initial count failure from zero notifications', async () => {
    vi.mocked(getUnreadAlertsCount).mockRejectedValueOnce(new Error('offline'));
    const { result } = renderHook(useAlerts, { wrapper });
    await settle();
    expect(result.current.unreadCount).toBeNull();
    expect(result.current.countError).toBe(
      'Não foi possível atualizar o contador de notificações.'
    );
    vi.mocked(getUnreadAlertsCount).mockResolvedValue(0);
    await act(async () => result.current.refreshAlerts());
    expect(result.current.unreadCount).toBe(0);
  });

  it('clears state on identity change and ignores old count and list responses', async () => {
    const oldCount = deferred<number>();
    const oldList = deferred<AlertsPage>();
    vi.mocked(getUnreadAlertsCount)
      .mockReturnValueOnce(oldCount.promise)
      .mockResolvedValue(1);
    vi.mocked(listAlerts).mockReturnValueOnce(oldList.promise);
    const { result } = renderHook(useAlerts, { wrapper });
    act(() => result.current.setOpen(true));
    act(() =>
      useAuth.setState({ user: { ...MOCK_AUTH_USER, id: 'other-user' } })
    );
    expect(result.current.alerts).toBeNull();
    expect(result.current.unreadCount).toBeNull();
    expect(result.current.isOpen).toBe(false);
    await settle();
    await act(async () => {
      oldCount.resolve(99);
      oldList.resolve(MOCK_PAGE);
    });
    expect(result.current.unreadCount).toBe(1);
    expect(result.current.alerts).toBeNull();
  });

  it('stops timers and listeners on logout and starts fresh on login', async () => {
    const { result } = renderHook(useAlerts, { wrapper });
    await settle();
    const previousRefresh = result.current.refreshAlerts;
    act(() => useAuth.getState().logout());
    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
      await vi.advanceTimersByTimeAsync(120_000);
      await previousRefresh();
    });
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
    act(() => seedAuthState({ status: 'authenticated', user: MOCK_AUTH_USER }));
    expect(result.current.unreadCount).toBeNull();
    await settle();
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(2);
  });

  it('does not request alerts before authentication', async () => {
    seedAuthState();
    renderHook(useAlerts, { wrapper });
    await settle();
    expect(getUnreadAlertsCount).not.toHaveBeenCalled();
    expect(listAlerts).not.toHaveBeenCalled();
  });

  it('discards requests from the first StrictMode effect lifecycle', async () => {
    const oldCount = deferred<number>();
    vi.mocked(getUnreadAlertsCount)
      .mockReturnValueOnce(oldCount.promise)
      .mockResolvedValue(2);
    const { result } = renderHook(useAlerts, {
      wrapper,
      reactStrictMode: true,
    });
    await settle();
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(2);
    await act(async () => oldCount.resolve(99));
    expect(result.current.unreadCount).toBe(2);
  });
});

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getUnreadAlertsCount, listAlerts } from '../../services/api/alertsApi';
import { ApiError } from '../../services/api/apiError';
import { useAuth } from '../auth/useAuth';
import { ALERT_MESSAGES } from './alertMessages';
import type { AlertsPage } from './types';
import { AlertsContext, type AlertsLoadStatus } from './useAlerts';

interface ResourceState<T> {
  data: T | null;
  status: AlertsLoadStatus;
  error: string | null;
}

function useAlertResource<T>(load: () => Promise<T>, fallback: string) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    status: 'idle',
    error: null,
  });
  const lifecycle = useRef(0);
  const active = useRef(false);
  const pending = useRef<Promise<void> | null>(null);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      lifecycle.current += 1;
      pending.current = null;
    };
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (!active.current) return Promise.resolve();
    if (pending.current) return pending.current;
    const version = lifecycle.current;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    const task = (async () => {
      try {
        const data = await load();
        if (active.current && lifecycle.current === version) {
          setState({ data, status: 'success', error: null });
        }
      } catch (error) {
        if (active.current && lifecycle.current === version) {
          setState((previous) => ({
            ...previous,
            status: 'error',
            error: error instanceof ApiError ? error.message : fallback,
          }));
        }
      } finally {
        if (lifecycle.current === version) pending.current = null;
      }
    })();
    pending.current = task;
    return task;
  }, [fallback, load]);

  // Explicit invalidation waits out an older fetch, then reads fresh server data.
  const revalidate = useCallback(async () => {
    const version = lifecycle.current;
    if (pending.current) await pending.current;
    if (lifecycle.current === version) await refresh();
  }, [refresh]);

  return { state, refresh, revalidate };
}

function AuthenticatedAlertsProvider({ children }: { children: ReactNode }) {
  const count = useAlertResource(
    getUnreadAlertsCount,
    ALERT_MESSAGES.countError
  );
  const list = useAlertResource<AlertsPage>(
    listAlerts,
    ALERT_MESSAGES.listError
  );
  const [isOpen, setIsOpen] = useState(false);
  const open = useRef(false);
  const explicitRefresh = useRef<Promise<void> | null>(null);
  const refreshCount = count.refresh;
  const refreshList = list.refresh;
  const revalidateCount = count.revalidate;
  const revalidateList = list.revalidate;

  useEffect(() => {
    const refresh = () => {
      void refreshCount();
      if (open.current) void refreshList();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    refresh();
    const timer = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [refreshCount, refreshList]);

  const setOpen = useCallback(
    (next: boolean) => {
      if (next === open.current) return;
      open.current = next;
      setIsOpen(next);
      // Always reload on opening: a closed list is never treated as fresh.
      if (next) void revalidateList();
    },
    [revalidateList]
  );

  const refreshAlerts = useCallback((): Promise<void> => {
    if (explicitRefresh.current) return explicitRefresh.current;
    const task = Promise.all([
      revalidateCount(),
      ...(open.current ? [revalidateList()] : []),
    ])
      .then(() => undefined)
      .finally(() => {
        explicitRefresh.current = null;
      });
    explicitRefresh.current = task;
    return task;
  }, [revalidateCount, revalidateList]);

  return (
    <AlertsContext.Provider
      value={{
        unreadCount: count.state.data,
        countStatus: count.state.status,
        countError: count.state.error,
        alerts: list.state.data,
        listStatus: list.state.status,
        listError: list.state.error,
        isOpen,
        setOpen,
        refreshAlerts,
      }}
    >
      {children}
    </AlertsContext.Provider>
  );
}

export function AlertsProvider({ children }: { children: ReactNode }) {
  const userId = useAuth((state) =>
    state.status === 'authenticated' ? state.user?.id : undefined
  );
  if (!userId) return null;
  // A new identity gets a fresh cache; old requests belong to the unmounted tree.
  return (
    <AuthenticatedAlertsProvider key={userId}>
      {children}
    </AuthenticatedAlertsProvider>
  );
}

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  getUnreadAlertsCount,
  listAlerts,
  markAlertAsRead,
} from '../../services/api/alertsApi';
import { ApiError } from '../../services/api/apiError';
import { useAuth } from '../auth/useAuth';
import { ALERT_MESSAGES } from './alertMessages';
import type { Alert, AlertsPage } from './types';
import { AlertsContext, type AlertsLoadStatus } from './useAlerts';

interface ResourceState<T> {
  data: T | null;
  status: AlertsLoadStatus;
  error: string | null;
}

function useAlertResource<T>(
  load: () => Promise<T>,
  fallback: string,
  blocked: RefObject<boolean>
) {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    status: 'idle',
    error: null,
  });
  const lifecycle = useRef(0);
  const active = useRef(false);
  const pending = useRef<Promise<void> | null>(null);
  const revision = useRef(0);

  const invalidate = useCallback(() => {
    revision.current += 1;
    pending.current = null;
  }, []);

  const update = useCallback(
    (transform: (data: T | null) => T | null) => {
      invalidate();
      setState((previous) => {
        const data = transform(previous.data);
        return {
          data,
          status: data === null ? 'idle' : 'success',
          error: null,
        };
      });
    },
    [invalidate]
  );

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      lifecycle.current += 1;
      pending.current = null;
    };
  }, []);

  const refresh = useCallback((): Promise<void> => {
    if (!active.current || blocked.current) return Promise.resolve();
    if (pending.current) return pending.current;
    const version = lifecycle.current;
    const requestRevision = revision.current;
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    const task = (async () => {
      try {
        const data = await load();
        if (
          active.current &&
          lifecycle.current === version &&
          revision.current === requestRevision
        ) {
          setState({ data, status: 'success', error: null });
        }
      } catch (error) {
        if (
          active.current &&
          lifecycle.current === version &&
          revision.current === requestRevision
        ) {
          setState((previous) => ({
            ...previous,
            status: 'error',
            error: error instanceof ApiError ? error.message : fallback,
          }));
        }
      } finally {
        if (
          lifecycle.current === version &&
          revision.current === requestRevision
        )
          pending.current = null;
      }
    })();
    pending.current = task;
    return task;
  }, [blocked, fallback, load]);

  // Explicit invalidation waits out an older fetch, then reads fresh server data.
  const revalidate = useCallback(async () => {
    const version = lifecycle.current;
    if (pending.current) await pending.current;
    if (lifecycle.current === version) await refresh();
  }, [refresh]);

  return { state, refresh, revalidate, invalidate, update };
}

function AuthenticatedAlertsProvider({
  children,
  userId,
}: {
  children: ReactNode;
  userId: string;
}) {
  const reading = useRef(false);
  const count = useAlertResource(
    getUnreadAlertsCount,
    ALERT_MESSAGES.countError,
    reading
  );
  const list = useAlertResource<AlertsPage>(
    listAlerts,
    ALERT_MESSAGES.listError,
    reading
  );
  const [isOpen, setIsOpen] = useState(false);
  const open = useRef(false);
  const explicitRefresh = useRef<Promise<void> | null>(null);
  const refreshCount = count.refresh;
  const refreshList = list.refresh;
  const revalidateCount = count.revalidate;
  const revalidateList = list.revalidate;
  const invalidateCount = count.invalidate;
  const invalidateList = list.invalidate;
  const updateCount = count.update;
  const updateList = list.update;
  const [pendingReadIds, setPendingReadIds] = useState<string[]>([]);
  const [readErrors, setReadErrors] = useState<Record<string, string>>({});
  const readRequests = useRef(new Map<string, Promise<Alert | null>>());
  const confirmedReads = useRef(new Map<string, Alert>());
  const mounted = useRef(false);
  const sessionVersion = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      sessionVersion.current += 1;
    };
  }, []);

  const markAsRead = useCallback(
    (alert: Alert): Promise<Alert | null> => {
      const version = sessionVersion.current;
      const isCurrent = () => {
        const auth = useAuth.getState();
        return (
          mounted.current &&
          sessionVersion.current === version &&
          auth.status === 'authenticated' &&
          auth.user?.id === userId
        );
      };
      if (!isCurrent()) return Promise.resolve(null);
      const existing = readRequests.current.get(alert.id);
      if (existing) return existing;
      const confirmed = confirmedReads.current.get(alert.id);
      if (confirmed) return Promise.resolve(confirmed);
      if (alert.status === 'READ') return Promise.resolve(alert);

      // Freeze reads before PATCH: polling must not count this transition twice.
      reading.current = true;
      invalidateCount();
      invalidateList();
      setPendingReadIds((ids) => [...ids, alert.id]);
      setReadErrors((errors) => {
        const next = { ...errors };
        delete next[alert.id];
        return next;
      });

      const task = (async () => {
        try {
          const updated = await markAlertAsRead(alert.id);
          if (!isCurrent()) return null;
          confirmedReads.current.set(alert.id, updated);
          updateList(
            (page) =>
              page && {
                ...page,
                items: page.items.map((item) =>
                  item.id === alert.id ? updated : item
                ),
              }
          );
          updateCount((value) =>
            value === null ? null : Math.max(0, value - 1)
          );
          return updated;
        } catch (error) {
          if (isCurrent()) {
            setReadErrors((errors) => ({
              ...errors,
              [alert.id]:
                error instanceof ApiError
                  ? error.message
                  : ALERT_MESSAGES.readError,
            }));
          }
          return null;
        } finally {
          readRequests.current.delete(alert.id);
          if (isCurrent()) {
            setPendingReadIds((ids) => ids.filter((id) => id !== alert.id));
            reading.current = readRequests.current.size > 0;
            if (!reading.current) {
              // Reconciliation is background work; a failed GET cannot undo PATCH.
              void refreshCount();
              if (open.current) void refreshList();
            }
          }
        }
      })();
      readRequests.current.set(alert.id, task);
      return task;
    },
    [
      invalidateCount,
      invalidateList,
      refreshCount,
      refreshList,
      updateCount,
      updateList,
      userId,
    ]
  );

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
        pendingReadIds,
        readErrors,
        markAsRead,
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
    <AuthenticatedAlertsProvider key={userId} userId={userId}>
      {children}
    </AuthenticatedAlertsProvider>
  );
}

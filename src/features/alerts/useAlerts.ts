import { createContext, useContext } from 'react';
import type { Alert, AlertsPage } from './types';

export type AlertsLoadStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AlertsContextValue {
  unreadCount: number | null;
  countStatus: AlertsLoadStatus;
  countError: string | null;
  alerts: AlertsPage | null;
  listStatus: AlertsLoadStatus;
  listError: string | null;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  refreshAlerts: () => Promise<void>;
  pendingReadIds: readonly string[];
  readErrors: Readonly<Record<string, string>>;
  /** Null means the operation failed or its session ended. */
  markAsRead: (alert: Alert) => Promise<Alert | null>;
}

export const AlertsContext = createContext<AlertsContextValue | null>(null);

export function useAlerts(): AlertsContextValue {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within AlertsProvider');
  return context;
}

const noRefresh = (): Promise<void> => Promise.resolve();

/**
 * Refreshes the bell after a change that resolves alerts on the backend.
 * Outside an AlertsProvider (no signed-in bell) there is nothing to refresh.
 */
export function useRefreshAlerts(): () => Promise<void> {
  return useContext(AlertsContext)?.refreshAlerts ?? noRefresh;
}

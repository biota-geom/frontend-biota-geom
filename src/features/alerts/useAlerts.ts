import { createContext, useContext } from 'react';
import type { AlertsPage } from './types';

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
}

export const AlertsContext = createContext<AlertsContextValue | null>(null);

export function useAlerts(): AlertsContextValue {
  const context = useContext(AlertsContext);
  if (!context) throw new Error('useAlerts must be used within AlertsProvider');
  return context;
}

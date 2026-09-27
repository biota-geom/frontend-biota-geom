import { create } from 'zustand';
import { ApiError } from '../../services/api/apiError';
import { listLicenses } from '../../services/api/licensesApi';
import type { LicensePanelItem, LicenseSummary } from './types';

const FETCH_ERROR_MESSAGE = 'Não foi possível carregar as licenças da empresa.';

export type LicensesPanelStatus = 'idle' | 'loading' | 'success' | 'error';

interface LicensesPanelState {
  summary: LicenseSummary | null;
  licenses: LicensePanelItem[];
  status: LicensesPanelStatus;
  error: string | null;
  /**
   * Id of the load that currently owns the store, mirroring
   * useCompanyContext: a response for a customerId the caller has since
   * navigated away from is dropped instead of overwriting newer state.
   */
  requestedCustomerId: string | null;
  loadLicenses: (customerId: string) => Promise<void>;
}

export const useLicensesPanel = create<LicensesPanelState>((set, get) => ({
  summary: null,
  licenses: [],
  status: 'idle',
  error: null,
  requestedCustomerId: null,

  loadLicenses: async (customerId) => {
    set({ status: 'loading', error: null, requestedCustomerId: customerId });

    try {
      const panel = await listLicenses(customerId);
      if (get().requestedCustomerId !== customerId) return;
      set({
        summary: panel.summary,
        licenses: panel.licenses,
        status: 'success',
        error: null,
      });
    } catch (error) {
      if (get().requestedCustomerId !== customerId) return;
      const message =
        error instanceof ApiError ? error.message : FETCH_ERROR_MESSAGE;
      set({ status: 'error', error: message });
    }
  },
}));

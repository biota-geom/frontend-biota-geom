import { create } from 'zustand';
import { getCompanyById } from '../../services/api/companiesApi';
import type { Company } from './types';

export type CompanyContextStatus = 'idle' | 'loading' | 'success' | 'error';

interface CompanyContextState {
  company: Company | null;
  status: CompanyContextStatus;
  /**
   * Id of the load that currently owns the store. A response whose id no longer
   * matches is dropped, so switching companies (or leaving the context) can't be
   * overwritten by a slower request started earlier.
   */
  requestedCompanyId: string | null;
  loadCompany: (companyId: string) => Promise<void>;
  clearCompany: () => void;
}

/*
 * Single source of truth for the company in scope: CompanyLayout loads it once
 * per :companyId, and every route under it — header included — reads from here
 * instead of fetching again.
 */
export const useCompanyContext = create<CompanyContextState>((set, get) => ({
  company: null,
  status: 'idle',
  requestedCompanyId: null,

  loadCompany: async (companyId) => {
    set({ company: null, status: 'loading', requestedCompanyId: companyId });

    try {
      const company = await getCompanyById(companyId);
      if (get().requestedCompanyId !== companyId) return;
      set({ company, status: 'success' });
    } catch {
      if (get().requestedCompanyId !== companyId) return;
      set({ company: null, status: 'error' });
    }
  },

  clearCompany: () =>
    set({ company: null, status: 'idle', requestedCompanyId: null }),
}));

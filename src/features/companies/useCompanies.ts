import { create } from 'zustand';
import { ApiError } from '../../services/api/apiError';
import * as customersApi from '../../services/api/customersApi';
import type { Company } from './types';

const FETCH_ERROR_MESSAGE =
  'Não foi possível carregar as empresas cadastradas.';

type CompaniesStatus = 'idle' | 'loading' | 'success' | 'error';

interface CompaniesState {
  companies: Company[];
  status: CompaniesStatus;
  error: string | null;
  fetchCompanies: () => Promise<void>;
}

export const useCompanies = create<CompaniesState>((set, get) => ({
  companies: [],
  status: 'idle',
  error: null,

  fetchCompanies: async () => {
    if (get().status === 'loading') return;

    set({ status: 'loading', error: null });

    try {
      const companies = await customersApi.listCompanies();
      set({ companies, status: 'success', error: null });
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : FETCH_ERROR_MESSAGE;
      set({ status: 'error', error: message });
    }
  },
}));

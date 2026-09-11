import { create } from 'zustand';
import type { Company } from './types';

interface CompanyContextState {
  company: Company | null;
  setCompany: (company: Company) => void;
  clearCompany: () => void;
}

export const useCompanyContext = create<CompanyContextState>((set) => ({
  company: null,
  setCompany: (company) => set({ company }),
  clearCompany: () => set({ company: null }),
}));

import { create } from 'zustand';
import type { CompanyDetail } from './types';

interface CompanyContextState {
  company: CompanyDetail | null;
  setCompany: (company: CompanyDetail) => void;
  clearCompany: () => void;
}

export const useCompanyContext = create<CompanyContextState>((set) => ({
  company: null,
  setCompany: (company) => set({ company }),
  clearCompany: () => set({ company: null }),
}));

import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import type { Company } from '../../features/companies/types';
import { useCompanies } from '../../features/companies/useCompanies';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { ApiError } from '../../services/api/apiError';
import { getCompanyById } from '../../services/api/companiesApi';
import { listCompanies } from '../../services/api/customersApi';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn(),
  createCompany: vi.fn(),
  linkCompanyEsgMetrics: vi.fn(),
}));

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

const mockedGetCompanyById = vi.mocked(getCompanyById);
const mockedListCompanies = vi.mocked(listCompanies);

const company: Company = {
  id: 'company-1',
  name: 'Unidade Industrial RS',
  status: 'active',
  segment: 'Siderurgia',
  location: 'Porto Alegre - RS',
};

beforeEach(() => {
  vi.clearAllMocks();
  useCompanies.setState({ companies: [], status: 'idle', error: null });
  useCompanyContext.getState().clearCompany();
  mockedListCompanies.mockResolvedValue([company]);
});

describe('CompanyDashboardPage', () => {
  it('renders the company scope loaded once by the layout', async () => {
    mockedGetCompanyById.mockResolvedValue(company);

    renderWithAuth(<AppRoutes />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
      initialRoute: '/companies/company-1/dashboard',
    });

    expect(screen.getByRole('status')).toHaveTextContent('Carregando...');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Painel de controle' })
      ).toBeInTheDocument();
    });

    expect(mockedGetCompanyById).toHaveBeenCalledWith('company-1');
    // A busca vive só no CompanyLayout: a página não repete a chamada
    expect(mockedGetCompanyById).toHaveBeenCalledTimes(1);
    expect(useCompanyContext.getState().company).toEqual(company);
    expect(
      screen.getByRole('button', { name: 'Empresa em contexto' })
    ).toHaveTextContent('Unidade Industrial RS');
  });

  it('shows a not found state and links back to the company list', async () => {
    mockedGetCompanyById.mockRejectedValue(
      new ApiError(404, 'Empresa não encontrada')
    );

    renderWithAuth(<AppRoutes />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
      initialRoute: '/companies/invalid-company/dashboard',
    });

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Empresa não encontrada' })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('link', { name: /voltar para empresas/i })
    ).toHaveAttribute('href', '/admin/companies');
    expect(useCompanyContext.getState().company).toBeNull();
  });
});

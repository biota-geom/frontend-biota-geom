import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import type { CompanyDetail } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { getCompanyById } from '../../services/api/companiesApi';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn(),
}));

const mockedGetCompanyById = vi.mocked(getCompanyById);

const company: CompanyDetail = {
  id: 'company-1',
  name: 'Unidade Industrial RS',
  document: '12345678000199',
  documentType: 'cnpj',
  status: 'active',
  sector: { id: 'sector-1', name: 'Siderurgia' },
  address: { city: 'Porto Alegre', state: 'RS' },
};

afterEach(() => {
  useCompanyContext.getState().clearCompany();
});

describe('CompanyDashboardPage', () => {
  it('loads the route id and saves the company scope globally', async () => {
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
    expect(useCompanyContext.getState().company).toEqual(company);
    expect(
      screen.getByRole('button', { name: 'Empresa em contexto' })
    ).toHaveTextContent('Unidade Industrial RS');
  });

  it('shows a not found state and links back to the company list', async () => {
    mockedGetCompanyById.mockRejectedValue(new Error('not found'));

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

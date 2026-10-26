import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanies } from '../../features/companies/useCompanies';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { ApiError } from '../../services/api/apiError';
import { getCompanyById } from '../../services/api/companiesApi';
import { listCompanies } from '../../services/api/customersApi';
import {
  getLicenseConditionsCompliance,
  listLicenseConditions,
} from '../../services/api/licenseConditionsApi';
import { listLicenses } from '../../services/api/licensesApi';
import { useLicensesPanel } from '../../features/licenses/useLicensesPanel';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn(),
  createCompany: vi.fn(),
  linkCompanyEsgMetrics: vi.fn(),
}));

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

vi.mock('../../services/api/licenseConditionsApi', () => ({
  listLicenseConditions: vi.fn(),
  getLicenseConditionsCompliance: vi.fn(),
}));

vi.mock('../../services/api/licensesApi', () => ({
  listLicenses: vi.fn(),
}));

const mockedGetCompanyById = vi.mocked(getCompanyById);
const mockedListCompanies = vi.mocked(listCompanies);

const company: CompanyListItem = {
  id: 'company-1',
  name: 'Unidade Industrial RS',
  status: 'active',
  segment: 'Siderurgia',
  location: 'Porto Alegre - RS',
  conformityPercentage: null,
  totalLicenses: 6,
  updatedAt: '2026-09-17T14:30:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  useCompanies.setState({ companies: [], status: 'idle', error: null });
  useCompanyContext.getState().clearCompany();
  useLicensesPanel.setState({
    summary: null,
    licenses: [],
    status: 'idle',
    error: null,
    requestedCustomerId: null,
  });
  mockedListCompanies.mockResolvedValue([company]);
  vi.mocked(listLicenseConditions).mockResolvedValue({
    total: 0,
    conditions: [],
  });
  vi.mocked(getLicenseConditionsCompliance).mockResolvedValue({
    totalActive: 0,
    inCompliance: 0,
    compliancePercentage: 100,
  });
  vi.mocked(listLicenses).mockResolvedValue({
    summary: { total: 0, regular: 0, attention: 0, expired: 0 },
    licenses: [],
  });
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

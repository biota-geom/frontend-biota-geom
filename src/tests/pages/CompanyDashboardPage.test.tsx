import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanies } from '../../features/companies/useCompanies';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { ApiError } from '../../services/api/apiError';
import { getCompanyById } from '../../services/api/companiesApi';
import { listCompanies } from '../../services/api/customersApi';
import {
  getLicenseDashboard,
  listLicenses,
} from '../../services/api/licensesApi';
import {
  getLicenseConditionsCompliance,
  listLicenseConditions,
} from '../../services/api/licenseConditionsApi';
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

vi.mock('../../services/api/licensesApi', () => ({
  getLicenseDashboard: vi.fn(),
  listLicenses: vi.fn(),
}));

vi.mock('../../services/api/licenseConditionsApi', () => ({
  listLicenseConditions: vi.fn(),
  getLicenseConditionsCompliance: vi.fn(),
}));

const mockedGetCompanyById = vi.mocked(getCompanyById);
const mockedListCompanies = vi.mocked(listCompanies);
const mockedGetLicenseDashboard = vi.mocked(getLicenseDashboard);

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
  mockedGetLicenseDashboard.mockResolvedValue({
    header: { activeLicenses: 4, pendingItems: 3 },
    counts: { regular: 2, attention: 1, expired: 1 },
    critical: [
      {
        id: 'license-1',
        type: 'LO',
        processNumber: 'LO 118/2020',
        expirationDate: '2026-09-01',
        status: 'Vencida',
      },
    ],
  });
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
  it('renders the company scope and license dashboard loaded by the page', async () => {
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
    expect(mockedGetLicenseDashboard).toHaveBeenCalledWith('company-1');
    expect(screen.getByText('4 Licenças Ativas')).toBeInTheDocument();
    expect(screen.getByText('3 Pendências')).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: 'Condicionantes Ambientais' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Contagem de licenças por situação' })
    ).toHaveTextContent('2');
    expect(screen.getByText('LO 118/2020')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver detalhes/i })).toHaveAttribute(
      'href',
      '/companies/company-1/licenses'
    );
    expect(screen.getByRole('link', { name: 'LO 118/2020' })).toHaveAttribute(
      'href',
      '/companies/company-1/licenses/license-1'
    );
  });

  it('shows an error and allows retrying the dashboard request', async () => {
    mockedGetCompanyById.mockResolvedValue(company);
    mockedGetLicenseDashboard
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce({
        header: { activeLicenses: 4, pendingItems: 3 },
        counts: { regular: 2, attention: 1, expired: 1 },
        critical: [],
      });

    const user = userEvent.setup();
    renderWithAuth(<AppRoutes />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
      initialRoute: '/companies/company-1/dashboard',
    });

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o resumo de licenças.'
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(await screen.findByText('4 Licenças Ativas')).toBeInTheDocument();
    expect(mockedGetLicenseDashboard).toHaveBeenCalledTimes(2);
  });

  it('displays zero for each dashboard counter when there are no licenses', async () => {
    mockedGetCompanyById.mockResolvedValue(company);
    mockedGetLicenseDashboard.mockResolvedValue({
      header: { activeLicenses: 0, pendingItems: 0 },
      counts: { regular: 0, attention: 0, expired: 0 },
      critical: [],
    });

    renderWithAuth(<AppRoutes />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
      initialRoute: '/companies/company-1/dashboard',
    });

    expect(await screen.findByText('0 Licenças Ativas')).toBeInTheDocument();
    expect(screen.getByText('0 Pendências')).toBeInTheDocument();
    const counts = screen.getByRole('region', {
      name: 'Contagem de licenças por situação',
    });
    expect(counts).toHaveTextContent('0');
    expect(counts).toHaveTextContent('Regulares');
    expect(counts).toHaveTextContent('Atenção');
    expect(counts).toHaveTextContent('Vencidas');
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

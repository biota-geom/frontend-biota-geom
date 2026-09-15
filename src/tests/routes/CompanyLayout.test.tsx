import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const OURO_PRETO: Company = {
  id: 'customer-1',
  name: 'Unidade Industrial Ouro Preto',
  status: 'active',
  segment: 'Mineração',
  location: 'Ouro Preto - MG',
};

const CARAJAS: Company = {
  id: 'customer-2',
  name: 'Complexo Minerário Carajás',
  status: 'active',
  segment: 'Mineração',
  location: 'Parauapebas - PA',
};

const REGISTERED_COMPANIES = [OURO_PRETO, CARAJAS];

function renderAppRoutes(initialRoute: string) {
  return renderWithAuth(<AppRoutes />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
    initialRoute,
  });
}

function getContextTrigger() {
  return screen.getByRole('button', { name: /empresa em contexto/i });
}

async function openCompanySelector(user: ReturnType<typeof userEvent.setup>) {
  await user.click(getContextTrigger());
  return screen.getByRole('listbox');
}

beforeEach(() => {
  vi.clearAllMocks();
  useCompanies.setState({ companies: [], status: 'idle', error: null });
  useCompanyContext.getState().clearCompany();

  mockedListCompanies.mockResolvedValue(REGISTERED_COMPANIES);
  mockedGetCompanyById.mockImplementation(async (companyId: string) => {
    const company = REGISTERED_COMPANIES.find(
      (candidate) => candidate.id === companyId
    );
    if (!company) throw new ApiError(404, 'Empresa não encontrada');
    return company;
  });
});

describe('CompanyLayout', () => {
  it('lists the companies registered in the backend, not a local seed', async () => {
    const user = userEvent.setup();
    renderAppRoutes('/companies/customer-1/dashboard');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Unidade Industrial Ouro Preto'
      );
    });

    const listbox = await openCompanySelector(user);

    expect(mockedListCompanies).toHaveBeenCalled();
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(
      screen.getByRole('option', { name: /complexo minerário carajás/i })
    ).toBeInTheDocument();
    // A localização vem pronta do backend ("Cidade - UF")
    expect(listbox).toHaveTextContent('Parauapebas - PA');
  });

  it('navigates to the company picked from the backend listing', async () => {
    const user = userEvent.setup();
    renderAppRoutes('/companies/customer-1/dashboard');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Unidade Industrial Ouro Preto'
      );
    });

    await openCompanySelector(user);
    await user.click(
      screen.getByRole('option', { name: /complexo minerário carajás/i })
    );

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Complexo Minerário Carajás'
      );
    });

    expect(mockedGetCompanyById).toHaveBeenCalledWith('customer-2');
    expect(screen.getByRole('link', { name: 'Licenças' })).toHaveAttribute(
      'href',
      '/companies/customer-2/licenses'
    );
  });

  it('offers no options while the registered companies are still loading', async () => {
    const user = userEvent.setup();
    mockedListCompanies.mockReturnValue(new Promise(() => {}));

    renderAppRoutes('/companies/customer-1/dashboard');

    await openCompanySelector(user);

    expect(screen.getByText('Carregando empresas...')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('shows the real company name on a route other than the dashboard', async () => {
    renderAppRoutes('/companies/customer-1/licenses');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Unidade Industrial Ouro Preto'
      );
    });

    expect(mockedGetCompanyById).toHaveBeenCalledWith('customer-1');
    expect(
      screen.getByRole('heading', { name: 'Painel de licenças ambientais' })
    ).toBeInTheDocument();
  });

  it('keeps the context loaded across every company route', async () => {
    for (const route of [
      'obligations',
      'legislation',
      'indicators',
      'documents',
    ]) {
      const { unmount } = renderAppRoutes(`/companies/customer-1/${route}`);

      await waitFor(() => {
        expect(getContextTrigger()).toHaveTextContent(
          'Unidade Industrial Ouro Preto'
        );
      });

      unmount();
      useCompanyContext.getState().clearCompany();
    }
  });

  it('stops announcing a company when the route id does not exist', async () => {
    renderAppRoutes('/companies/empresa-desconhecida/dashboard');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent('Empresa não encontrada');
    });

    // Header e conteúdo contam a mesma história — nada de nome fantasma
    expect(
      screen.getByRole('heading', { name: 'Empresa não encontrada' })
    ).toBeInTheDocument();
    expect(getContextTrigger()).not.toHaveTextContent('Empresa em contexto');
    expect(useCompanyContext.getState().company).toBeNull();
  });

  it('replaces the child route with the not found state on every company route', async () => {
    renderAppRoutes('/companies/empresa-desconhecida/licenses');

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: 'Empresa não encontrada' })
      ).toBeInTheDocument();
    });

    expect(getContextTrigger()).toHaveTextContent('Empresa não encontrada');
    expect(
      screen.queryByRole('heading', { name: 'Painel de licenças ambientais' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /voltar para empresas/i })
    ).toHaveAttribute('href', '/admin/companies');
  });

  it('renders the company navigation with links scoped to that company', async () => {
    renderAppRoutes('/companies/customer-1/dashboard');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Unidade Industrial Ouro Preto'
      );
    });

    expect(screen.getByRole('link', { name: 'Licenças' })).toHaveAttribute(
      'href',
      '/companies/customer-1/licenses'
    );
    expect(screen.getByRole('link', { name: 'Obrigações' })).toHaveAttribute(
      'href',
      '/companies/customer-1/obligations'
    );
    expect(screen.getByRole('link', { name: 'Legislação' })).toHaveAttribute(
      'href',
      '/companies/customer-1/legislation'
    );
    expect(screen.getByRole('link', { name: 'ESG' })).toHaveAttribute(
      'href',
      '/companies/customer-1/indicators'
    );
    expect(screen.getByRole('link', { name: 'Documentos' })).toHaveAttribute(
      'href',
      '/companies/customer-1/documents'
    );
  });

  it('highlights the active company navigation link', async () => {
    renderAppRoutes('/companies/customer-1/dashboard');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Unidade Industrial Ouro Preto'
      );
    });

    const activeLink = screen.getByRole('link', { name: 'Painel' });
    const inactiveLink = screen.getByRole('link', { name: 'Licenças' });

    expect(activeLink.className).toContain('border-primary-strong');
    expect(inactiveLink.className).not.toContain('border-primary-strong');
  });

  it('surfaces a failed listing in the selector without blocking the context', async () => {
    const user = userEvent.setup();
    mockedListCompanies.mockRejectedValue(
      new ApiError(500, 'Erro interno do servidor.')
    );

    renderAppRoutes('/companies/customer-1/dashboard');

    await waitFor(() => {
      expect(getContextTrigger()).toHaveTextContent(
        'Unidade Industrial Ouro Preto'
      );
    });

    await openCompanySelector(user);

    expect(screen.getByText('Erro interno do servidor.')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});

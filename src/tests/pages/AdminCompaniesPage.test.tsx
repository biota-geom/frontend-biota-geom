import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';
import { useCompanies } from '../../features/companies/useCompanies';
import {
  getComplianceTone,
  getStatusLabel,
} from '../../pages/admin/Companies/companyCardFormatting';
import { ApiError } from '../../services/api/apiError';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

const customersApi = await import('../../services/api/customersApi');

const COMPANIES = [
  {
    id: 'customer-1',
    name: 'Unidade Industrial RS',
    status: 'active' as const,
    segment: 'Siderurgia',
    location: 'Porto Alegre - RS',
  },
  {
    id: 'customer-2',
    name: 'Fábrica São Paulo',
    status: 'active' as const,
    segment: 'Metalúrgica',
    location: 'Sorocaba - SP',
  },
  {
    id: 'customer-3',
    name: 'Agro Centro-Oeste',
    status: 'inactive' as const,
    segment: 'Agronegócio',
    location: 'Sorriso - MT',
  },
];

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes(initialRoute = APP_ROUTES.admin.companies) {
  return renderWithAuth(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { status: 'authenticated', user: MOCK_AUTH_USER, initialRoute }
  );
}

describe('AdminCompaniesPage', () => {
  beforeEach(() => {
    useCompanies.setState({ companies: [], status: 'idle', error: null });
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('fetches and renders company cards from the customers API', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);

    renderAppRoutes();

    expect(
      screen.getByRole('heading', { name: /empresas cadastradas/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole('article', { name: /unidade industrial rs/i })
      ).toBeInTheDocument();
    });

    expect(
      screen.getByRole('article', { name: /fábrica são paulo/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/atenção/i)).toHaveLength(3);
    expect(screen.getAllByText(/vencido/i)).toHaveLength(3);
    expect(screen.queryByText(/alertas/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /configurações/i })
    ).not.toBeInTheDocument();
  });

  it('shows an error state with a retry action when the fetch fails', async () => {
    vi.mocked(customersApi.listCompanies).mockRejectedValueOnce(
      new ApiError(500, 'Erro ao carregar empresas.')
    );

    const user = userEvent.setup();
    renderAppRoutes();

    await waitFor(() => {
      expect(
        screen.getByText(/erro ao carregar empresas\./i)
      ).toBeInTheDocument();
    });

    vi.mocked(customersApi.listCompanies).mockResolvedValueOnce(COMPANIES);
    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    await waitFor(() => {
      expect(
        screen.getByRole('article', { name: /unidade industrial rs/i })
      ).toBeInTheDocument();
    });
  });

  it('shows an empty state when there are no companies', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);

    renderAppRoutes();

    await waitFor(() => {
      expect(
        screen.getByText(/nenhuma empresa cadastrada até o momento\./i)
      ).toBeInTheDocument();
    });
  });

  it('navigates from a company card to the company dashboard', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    const user = userEvent.setup();
    renderAppRoutes();

    const companyCard = await screen.findByRole('article', {
      name: /unidade industrial rs/i,
    });

    await user.click(
      within(companyCard).getByRole('link', { name: /ver detalhes/i })
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      buildCompanyRoutes.dashboard('customer-1')
    );
  });

  it('renders the admin navigation with the current section highlighted', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    const companiesLink = screen.getByRole('link', { name: 'Empresas' });
    const legislationLink = screen.getByRole('link', { name: 'Legislação' });
    const indicatorsLink = screen.getByRole('link', { name: 'Indicadores' });

    expect(companiesLink).toHaveAttribute('href', APP_ROUTES.admin.companies);
    expect(legislationLink).toHaveAttribute(
      'href',
      APP_ROUTES.admin.legislation
    );
    expect(indicatorsLink).toHaveAttribute('href', APP_ROUTES.admin.indicators);
    expect(companiesLink.className).toContain('border-primary-strong');
    expect(legislationLink.className).not.toContain('border-primary-strong');
  });

  it('renders the "Nova Empresa" action button', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    expect(
      screen.getByRole('button', { name: /nova empresa/i })
    ).toBeInTheDocument();
  });

  it('shows edit and delete controls scoped to each company', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    const companyCard = await screen.findByRole('article', {
      name: /unidade industrial rs/i,
    });

    expect(
      within(companyCard).getByRole('button', {
        name: /editar unidade industrial rs/i,
      })
    ).toBeInTheDocument();
    expect(
      within(companyCard).getByRole('button', {
        name: /excluir unidade industrial rs/i,
      })
    ).toBeInTheDocument();
  });

  it('labels active and inactive companies with the matching status badge', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);
    renderAppRoutes();

    const activeCard = await screen.findByRole('article', {
      name: /unidade industrial rs/i,
    });
    const inactiveCard = screen.getByRole('article', {
      name: /agro centro-oeste/i,
    });

    const activeBadge = within(activeCard).getByText('Ativo');
    const inactiveBadge = within(inactiveCard).getByText('Inativo');

    expect(activeBadge.className).toContain('text-primary-strong');
    expect(inactiveBadge.className).toContain('text-amber-600');
  });
});

describe('getComplianceTone', () => {
  it.each([
    { compliance: 100, expected: '!text-primary-strong' },
    { compliance: 90, expected: '!text-primary-strong' },
    { compliance: 89, expected: '!text-amber-500' },
    { compliance: 70, expected: '!text-amber-500' },
    { compliance: 69, expected: '!text-red-500' },
    { compliance: 0, expected: '!text-red-500' },
  ])('returns $expected for $compliance%', ({ compliance, expected }) => {
    expect(getComplianceTone(compliance)).toBe(expected);
  });
});

describe('getStatusLabel', () => {
  it('returns "Ativo" for an active company', () => {
    expect(getStatusLabel('active')).toBe('Ativo');
  });

  it('returns "Inativo" for an inactive company', () => {
    expect(getStatusLabel('inactive')).toBe('Inativo');
  });
});

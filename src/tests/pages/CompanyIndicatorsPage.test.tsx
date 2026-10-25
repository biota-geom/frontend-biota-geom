import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { buildCompanyRoutes } from '../../app/router/routes';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { getPreviousMonth } from '../../features/esgIndicators/esgIndicatorsValidation';
import type { MonthlyIndicator } from '../../features/esgIndicators/types';
import { ApiError } from '../../services/api/apiError';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn(),
  createCompany: vi.fn(),
  linkCompanyEsgMetrics: vi.fn(),
  listCompanyEsgMetrics: vi.fn(),
}));
vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));
vi.mock('../../services/api/esgIndicatorsApi', () => ({
  getEsgIndicators: vi.fn(),
  saveEsgIndicators: vi.fn(),
  createCustomerIndicator: vi.fn(),
}));

const companiesApi = await import('../../services/api/companiesApi');
const customersApi = await import('../../services/api/customersApi');
const esgIndicatorsApi = await import('../../services/api/esgIndicatorsApi');

const COMPANY_ID = 'customer-1';

const COMPANY_IN_CONTEXT: CompanyListItem = {
  id: COMPANY_ID,
  name: 'Unidade Industrial RS',
  status: 'active',
  segment: 'Siderurgia',
  location: 'Porto Alegre - RS',
  conformityPercentage: null,
  totalLicenses: 1,
  updatedAt: '2026-09-01T12:00:00.000Z',
};

const EMPTY_MONTH: MonthlyIndicator[] = [];

const SEPTEMBER: MonthlyIndicator[] = [
  {
    indicator_id: 'uuid-ind-1',
    name: 'Consumo de Água',
    unit: 'm³',
    category: 'Ambiental',
    value: 12450.5,
  },
  {
    indicator_id: 'uuid-ind-2',
    name: 'Resíduos Gerados',
    unit: 't',
    category: 'Ambiental',
    value: 847,
  },
  {
    indicator_id: 'uuid-ind-3',
    name: 'Nº de Funcionários',
    unit: 'pessoas',
    category: 'Social',
    value: 342,
  },
  {
    indicator_id: 'uuid-ind-4',
    name: 'Consumo de Energia',
    unit: 'kWh',
    category: 'Ambiental',
    value: 58700,
  },
];

function renderIndicatorsPage(
  initialRoute = buildCompanyRoutes.indicators(COMPANY_ID)
) {
  return renderWithAuth(<AppRoutes />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
    initialRoute,
  });
}

describe('CompanyIndicatorsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCompanyContext.getState().clearCompany();
    vi.mocked(companiesApi.getCompanyById).mockResolvedValue(
      COMPANY_IN_CONTEXT
    );
    vi.mocked(customersApi.listCompanies).mockResolvedValue([
      COMPANY_IN_CONTEXT,
    ]);
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(EMPTY_MONTH);
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockResolvedValue([]);
  });

  it('renders page header with title, subtitle, and action buttons', async () => {
    renderIndicatorsPage();

    expect(
      screen.getByRole('heading', { name: 'Indicadores ESG' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Métricas de desempenho ambiental, social e de sustentabilidade corporativa.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: /novo registro/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /gerar relatório/i })
    ).toBeInTheDocument();

    // Default fetch of previous month
    const previousMonth = getPreviousMonth();
    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        previousMonth
      )
    );
  });

  it('renders the KPI summary cards with fallback mock data when there are no loaded indicators', async () => {
    renderIndicatorsPage();

    // Mock data has these titles
    expect(await screen.findByText('Consumo de Água')).toBeInTheDocument();
    expect(screen.getByText('Resíduos Gerados')).toBeInTheDocument();
    expect(screen.getByText('Nº de Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Consumo de Energia')).toBeInTheDocument();
  });

  it('renders KPI summary cards with loaded dynamic indicators', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();

    // Wait for the loaded data first (12.450,5 only exists in SEPTEMBER).
    // Querying the names before this can grab fallback nodes that are
    // replaced when the loaded indicators render.
    // Formatted value appears in the aria-label (unit comes from the indicator).
    expect(
      await screen.findByLabelText(/Consumo de Água: 12\.450,5 m³/i)
    ).toBeInTheDocument();

    // Cards show the dynamic indicator names
    expect(screen.getByText('Consumo de Água')).toBeInTheDocument();
    expect(screen.getByText('Resíduos Gerados')).toBeInTheDocument();
    expect(screen.getByText('Nº de Funcionários')).toBeInTheDocument();
    expect(screen.getByText('Consumo de Energia')).toBeInTheDocument();
  });

  it('renders the 4 line charts with titles', async () => {
    renderIndicatorsPage();

    expect(
      await screen.findByRole('region', { name: 'Consumo de Água (m³/mês)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Resíduos Gerados (t/mês)' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', {
        name: 'Nº de Funcionários (pessoas/mês)',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', {
        name: 'Consumo de Energia Elétrica (kWh/mês)',
      })
    ).toBeInTheDocument();
  });

  it('opens "Novo Registro" modal with the company indicators', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();

    await screen.findByText('Consumo de Água');

    await user.click(screen.getByRole('button', { name: /novo registro/i }));

    expect(
      await screen.findByRole('heading', { name: 'Novo Registro de Indicador' })
    ).toBeInTheDocument();
  });

  it('blocks negative values in "Novo Registro" modal without calling PUT', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();
    await screen.findByText('Consumo de Água');

    await user.click(screen.getByRole('button', { name: /novo registro/i }));
    expect(
      await screen.findByRole('heading', { name: 'Novo Registro de Indicador' })
    ).toBeInTheDocument();

    // Scope to the dialog: the summary card and chart also have
    // "Consumo de Água" in their aria-labels.
    const dialog = await screen.findByRole('dialog');
    const waterInput = within(dialog).getByLabelText(/Consumo de Água/i);
    // The input is pre-filled with the saved value, so clear it first.
    await user.clear(waterInput);
    await user.type(waterInput, '-10');

    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    expect(
      await screen.findByText('O valor não pode ser negativo.')
    ).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('displays API error inside "Novo Registro" modal when PUT fails', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockRejectedValue(
      new ApiError(400, 'Erro retornado pela API.')
    );
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();
    await screen.findByText('Consumo de Água');

    await user.click(screen.getByRole('button', { name: /novo registro/i }));
    expect(
      await screen.findByRole('heading', { name: 'Novo Registro de Indicador' })
    ).toBeInTheDocument();

    const dialog = await screen.findByRole('dialog');
    const waterInput = within(dialog).getByLabelText(/Consumo de Água/i);
    await user.clear(waterInput);
    await user.type(waterInput, '500');

    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    expect(await screen.findByText('Erro retornado pela API.')).toBeVisible();
  });

  it('opens "Gerar Relatório" modal, triggers GET endpoint, and loads new data', async () => {
    const user = userEvent.setup();
    renderIndicatorsPage();

    const generateBtn = screen.getByRole('button', {
      name: /gerar relatório/i,
    });
    await user.click(generateBtn);

    expect(
      await screen.findByRole('heading', {
        name: 'Gerar Relatório de Indicadores',
      })
    ).toBeInTheDocument();

    const monthInput = screen.getByLabelText('Mês de Referência');
    await user.clear(monthInput);
    await user.type(monthInput, '2026-08');

    const submitBtn = screen.getByRole('button', { name: 'Gerar Relatório' });
    await user.click(submitBtn);

    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        '2026-08'
      )
    );

    expect(
      await screen.findByText('Relatório de agosto de 2026 gerado com sucesso.')
    ).toBeVisible();
  });

  it('shows error banner when initial load fails and allows retry', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockRejectedValueOnce(
      new ApiError(500, 'Falha no carregamento dos dados.')
    );
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();

    expect(
      await screen.findByText('Falha no carregamento dos dados.')
    ).toBeVisible();

    const retryBtn = screen.getByRole('button', { name: 'Tentar novamente' });
    await user.click(retryBtn);

    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenCalledTimes(2)
    );
  });

  it('supports navigation via alternate /companies/:companyId/esg route', async () => {
    renderIndicatorsPage(buildCompanyRoutes.esg(COMPANY_ID));

    expect(
      await screen.findByRole('heading', { name: 'Indicadores ESG' })
    ).toBeInTheDocument();
  });

  it('redirects /customers/:customerId/esg to /companies/:companyId/indicators', async () => {
    renderIndicatorsPage(`/customers/${COMPANY_ID}/esg`);

    expect(
      await screen.findByRole('heading', { name: 'Indicadores ESG' })
    ).toBeInTheDocument();
  });
});

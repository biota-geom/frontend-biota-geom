import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { buildCompanyRoutes } from '../../app/router/routes';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { getPreviousMonth } from '../../features/esgIndicators/esgIndicatorsValidation';
import type {
  EsgIndicatorsSummary,
  MonthlyIndicator,
} from '../../features/esgIndicators/types';
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
  getEsgIndicatorsSummary: vi.fn(),
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

// Summary of SEPTEMBER against an August with lower water and more staff.
const SEPTEMBER_SUMMARY: EsgIndicatorsSummary = {
  reference_month: '2026-09',
  indicators: SEPTEMBER.map(({ value, ...indicator }) => ({
    ...indicator,
    current: value,
    previous: null,
    variation_pct: null,
  })),
};
SEPTEMBER_SUMMARY.indicators[0].previous = 11318.6;
SEPTEMBER_SUMMARY.indicators[0].variation_pct = 10;
SEPTEMBER_SUMMARY.indicators[2].previous = 350;
SEPTEMBER_SUMMARY.indicators[2].variation_pct = -2.3;

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
    vi.mocked(esgIndicatorsApi.getEsgIndicatorsSummary).mockResolvedValue(
      SEPTEMBER_SUMMARY
    );
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

  it('loads the KPIs of the latest month with the change against the month before', async () => {
    renderIndicatorsPage();

    expect(
      await screen.findByLabelText('Consumo de Água: 12.450,5 m³')
    ).toBeInTheDocument();
    expect(esgIndicatorsApi.getEsgIndicatorsSummary).toHaveBeenCalledWith(
      COMPANY_ID,
      undefined
    );
    expect(
      screen.getByLabelText('Variação de Consumo de Água: ▲ 10,0%')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Variação de Resíduos Gerados: —')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Variação de Nº de Funcionários: ▼ 2,3%')
    ).toBeInTheDocument();
    expect(screen.getByText('Referência: setembro de 2026')).toBeVisible();
  });

  it('says so when the company has no indicator configured', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicatorsSummary).mockResolvedValue({
      reference_month: null,
      indicators: [],
    });

    renderIndicatorsPage();

    expect(
      await screen.findByText('Nenhum indicador configurado para esta empresa.')
    ).toBeVisible();
  });

  it('shows the summary error without breaking the page', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicatorsSummary).mockRejectedValue(
      new ApiError(500, 'Falha ao carregar o resumo.')
    );

    renderIndicatorsPage();

    expect(
      await screen.findByText('Falha ao carregar o resumo.')
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: 'Indicadores ESG' })
    ).toBeInTheDocument();
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

  it('renders one chart per company indicator, including inline-created ones, with monthly history', async () => {
    const fuel: MonthlyIndicator = {
      indicator_id: 'uuid-fuel',
      name: 'Consumo de Combustível',
      unit: 'L',
      category: 'Ambiental',
      value: 300,
    };
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockImplementation(
      async (_companyId, requestedMonth) =>
        requestedMonth === getPreviousMonth()
          ? [fuel]
          : [{ ...fuel, value: 100 }]
    );

    renderIndicatorsPage();

    const chart = await screen.findByRole('region', {
      name: 'Consumo de Combustível (L/mês)',
    });
    await waitFor(() => {
      const titles = chart.querySelectorAll('circle title');
      expect(titles).toHaveLength(6);
      titles.forEach((t) => expect(t.textContent).toMatch(/ L$/));
    });
    expect(
      screen.queryByRole('region', { name: 'Resíduos Gerados (t/mês)' })
    ).not.toBeInTheDocument();
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

  it('saves a month and moves the KPIs to the saved month', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();
    await screen.findByText('Consumo de Água');
    await user.click(screen.getByRole('button', { name: /novo registro/i }));

    const dialog = await screen.findByRole('dialog');
    const waterInput = within(dialog).getByLabelText(/Consumo de Água/i);
    await user.clear(waterInput);
    await user.type(waterInput, '1100');
    await user.click(
      within(dialog).getByRole('button', { name: 'Registrar Dados' })
    );

    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicatorsSummary).toHaveBeenLastCalledWith(
        COMPANY_ID,
        getPreviousMonth()
      )
    );
    expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalled();
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

  it('reloads the indicators when the modal closes after creating one inline', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);
    vi.mocked(esgIndicatorsApi.createCustomerIndicator).mockResolvedValue({
      indicator_id: 'uuid-new',
      name: 'Geração de Efluentes',
      unit: 'm³',
      category: 'Ambiental',
      value: null,
    });
    const selectedMonthCalls = () =>
      vi
        .mocked(esgIndicatorsApi.getEsgIndicators)
        .mock.calls.filter(([, month]) => month === getPreviousMonth()).length;

    renderIndicatorsPage();
    await screen.findByText('Consumo de Água');
    await user.click(screen.getByRole('button', { name: /novo registro/i }));

    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('button', { name: '+ Novo Indicador' })
    );
    await user.type(
      within(dialog).getByLabelText('Nome'),
      'Geração de Efluentes'
    );
    await user.type(within(dialog).getByLabelText('Unidade'), 'm³');
    await user.click(
      within(dialog).getByRole('button', { name: 'Criar Indicador' })
    );

    // The new field shows up in the form right away, ready to be filled.
    expect(
      await within(dialog).findByLabelText(/Geração de Efluentes \(m³\)/)
    ).toBeInTheDocument();

    const before = selectedMonthCalls();
    const summaryCallsBefore = vi.mocked(
      esgIndicatorsApi.getEsgIndicatorsSummary
    ).mock.calls.length;
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }));

    await waitFor(() => expect(selectedMonthCalls()).toBe(before + 1));
    // The KPIs reload too, so the new indicator gets its card.
    expect(
      vi.mocked(esgIndicatorsApi.getEsgIndicatorsSummary).mock.calls.length
    ).toBe(summaryCallsBefore + 1);
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
    // The KPIs follow the month of the report.
    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicatorsSummary).toHaveBeenLastCalledWith(
        COMPANY_ID,
        '2026-08'
      )
    );
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

    // Chart history requests hit the same mock, so count only the selected month.
    await waitFor(() =>
      expect(
        vi
          .mocked(esgIndicatorsApi.getEsgIndicators)
          .mock.calls.filter(
            ([, requestedMonth]) => requestedMonth === getPreviousMonth()
          )
      ).toHaveLength(2)
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

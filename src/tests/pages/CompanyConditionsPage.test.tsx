import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { buildCompanyRoutes } from '../../app/router/routes';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
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
vi.mock('../../services/api/licenseConditionsApi', () => ({
  listLicenseConditions: vi.fn(),
  getLicenseConditionsCompliance: vi.fn(),
  createLicenseCondition: vi.fn(),
}));
vi.mock('../../services/api/licensesApi', () => ({
  listLicenses: vi.fn(),
}));

const companiesApi = await import('../../services/api/companiesApi');
const customersApi = await import('../../services/api/customersApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');
const licensesApi = await import('../../services/api/licensesApi');

const COMPANY_ID = 'customer-1';

const COMPANY_IN_CONTEXT: CompanyListItem = {
  id: COMPANY_ID,
  name: 'Unidade Industrial Ouro Preto',
  status: 'active',
  segment: 'Mineração',
  location: 'Ouro Preto - MG',
  conformityPercentage: null,
  totalLicenses: 1,
  updatedAt: '2026-09-01T12:00:00.000Z',
};

const LINKED_GRI_PARAMETERS = [
  { id: 'metric-agua', name: 'Consumo de Água', unit: 'm³' },
  { id: 'metric-residuos', name: 'Resíduos Sólidos Gerados', unit: 't' },
];

function renderConditionsPage() {
  return renderWithAuth(<AppRoutes />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
    initialRoute: buildCompanyRoutes.conditions(COMPANY_ID),
  });
}

describe('CompanyConditionsPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useCompanyContext.getState().clearCompany();
    vi.mocked(companiesApi.getCompanyById).mockResolvedValue(
      COMPANY_IN_CONTEXT
    );
    vi.mocked(customersApi.listCompanies).mockResolvedValue([
      COMPANY_IN_CONTEXT,
    ]);
    vi.mocked(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).mockResolvedValue({
      totalActive: 0,
      inCompliance: 0,
      compliancePercentage: 100,
    });
    vi.mocked(companiesApi.listCompanyEsgMetrics).mockResolvedValue(
      LINKED_GRI_PARAMETERS
    );
    vi.mocked(licensesApi.listLicenses).mockResolvedValue({
      summary: { total: 1, regular: 1, attention: 0, expired: 0 },
      licenses: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          type: 'Licença de Operação (LO)',
          processNumber: 'LO nº 118/2020',
          issuingAgency: 'FEPAM',
          issueDate: '2020-01-10T00:00:00.000Z',
          expirationDate: '2099-01-10T00:00:00.000Z',
          status: 'Regular',
          documentUrl: null,
        },
      ],
    });
  });

  it('loads and renders the condition cards from the API', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 2,
      conditions: [
        {
          id: 'condition-risk',
          licenseId: 'license-1',
          name: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          category: { id: 'metric-emissoes', name: 'Emissões' },
          responsibleAgency: 'FEPAM',
          dueDate: '2026-02-11T00:00:00.000Z',
          status: 'Regular',
          riskLevel: 'RISK',
        },
        {
          id: 'condition-regular',
          licenseId: 'license-1',
          name: 'MTR - Manifesto de Transporte de Resíduos',
          description: 'Emissão de manifesto obrigatório.',
          category: { id: 'metric-residuos', name: 'Resíduos Sólidos Gerados' },
          responsibleAgency: 'FEPAM',
          dueDate: '2026-05-20T00:00:00.000Z',
          status: 'Regular',
          riskLevel: 'REGULAR',
        },
      ],
    });

    renderConditionsPage();

    expect(
      screen.getByRole('heading', {
        name: 'Monitor de Gestão Ambiental',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Acompanhamento de condicionantes e prazos regulatórios.'
      )
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(licenseConditionsApi.listLicenseConditions).toHaveBeenCalledWith(
        COMPANY_ID,
        'all'
      )
    );

    expect(
      screen.getByText('2 condicionantes registradas')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Automonitoramento Atmosférico')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: 'Automonitoramento Atmosférico' })
    ).toHaveClass('border-rose-500');
    expect(
      screen.getByText('MTR - Manifesto de Transporte de Resíduos')
    ).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('article', {
          name: 'MTR - Manifesto de Transporte de Resíduos',
        })
      ).getByText('Resíduos Sólidos Gerados')
    ).toBeInTheDocument();
  });

  it('lists exactly the GRI parameters linked to the company as categories', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });

    renderConditionsPage();
    await user.click(
      screen.getByRole('button', { name: 'Novo Condicionante' })
    );
    await waitFor(() =>
      expect(companiesApi.listCompanyEsgMetrics).toHaveBeenCalledWith(
        COMPANY_ID
      )
    );
    const categorySelect = screen.getByRole('combobox', { name: 'Categoria' });
    await waitFor(() => expect(categorySelect).toBeEnabled());
    await user.click(categorySelect);

    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual(['Consumo de Água', 'Resíduos Sólidos Gerados']);
  });

  it('guides the user to the GRI setup when the company has no linked parameters', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });
    vi.mocked(companiesApi.listCompanyEsgMetrics).mockResolvedValue([]);

    renderConditionsPage();
    await user.click(
      screen.getByRole('button', { name: 'Novo Condicionante' })
    );

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Esta empresa ainda não possui parâmetros GRI vinculados. Faça a parametrização GRI da empresa antes de cadastrar condicionantes.'
    );
    expect(screen.getByRole('combobox', { name: 'Categoria' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Cadastrar Condicionante' })
    ).toBeDisabled();
  });

  it('shows the API error when the GRI parameters cannot be loaded', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });
    vi.mocked(companiesApi.listCompanyEsgMetrics).mockRejectedValue(
      new ApiError(500, 'Falha ao listar parâmetros.')
    );

    renderConditionsPage();
    await user.click(
      screen.getByRole('button', { name: 'Novo Condicionante' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha ao listar parâmetros.'
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('falls back to a generic message when the GRI parameters fail unexpectedly', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });
    vi.mocked(companiesApi.listCompanyEsgMetrics).mockRejectedValue(
      new Error('network down')
    );

    renderConditionsPage();
    await user.click(
      screen.getByRole('button', { name: 'Novo Condicionante' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar os parâmetros GRI da empresa.'
    );
  });

  it('renders the overall compliance card above the filters', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });
    vi.mocked(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).mockResolvedValue({
      totalActive: 8,
      inCompliance: 4,
      compliancePercentage: 50,
    });

    renderConditionsPage();

    const card = await screen.findByRole('region', {
      name: 'Conformidade Geral',
    });
    expect(card).toHaveTextContent('4 de 8 condicionantes em dia');
    expect(card).toHaveTextContent('50%');
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '50'
    );
    expect(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).toHaveBeenCalledWith(COMPANY_ID);
    // Positioned before the status filter toolbar.
    expect(
      card.compareDocumentPosition(screen.getByRole('combobox')) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows an alert when the compliance summary fails to load', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });
    vi.mocked(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).mockRejectedValue(
      new ApiError(500, 'Não foi possível calcular a conformidade.')
    );

    renderConditionsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível calcular a conformidade.'
    );
    expect(
      screen.queryByRole('region', { name: 'Conformidade Geral' })
    ).not.toBeInTheDocument();
  });

  it('falls back to a generic message when the compliance error is unexpected', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });
    vi.mocked(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).mockRejectedValue(new Error('network down'));

    renderConditionsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar a conformidade geral.'
    );
  });

  it('shows the API error message when loading fails', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockRejectedValue(
      new ApiError(500, 'Não foi possível listar as condicionantes.')
    );

    renderConditionsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível listar as condicionantes.'
    );
  });

  it('reloads the list and counter when filtering and resetting the status', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockImplementation(
      async (_customerId, status) => {
        if (status === 'RISK') {
          return {
            total: 1,
            conditions: [
              {
                id: 'condition-risk',
                licenseId: 'license-1',
                name: 'Automonitoramento Atmosférico',
                description: 'Avaliação periódica de emissões.',
                category: { id: 'metric-emissoes', name: 'Emissões' },
                responsibleAgency: 'FEPAM',
                dueDate: '2026-02-11T00:00:00.000Z',
                status: 'Regular',
                riskLevel: 'RISK',
              },
            ],
          };
        }

        return {
          total: 2,
          conditions: [
            {
              id: 'condition-risk',
              licenseId: 'license-1',
              name: 'Automonitoramento Atmosférico',
              description: 'Avaliação periódica de emissões.',
              category: { id: 'metric-emissoes', name: 'Emissões' },
              responsibleAgency: 'FEPAM',
              dueDate: '2026-02-11T00:00:00.000Z',
              status: 'Regular',
              riskLevel: 'RISK',
            },
            {
              id: 'condition-regular',
              licenseId: 'license-1',
              name: 'MTR - Manifesto de Transporte de Resíduos',
              description: 'Emissão de manifesto obrigatório.',
              category: {
                id: 'metric-residuos',
                name: 'Resíduos Sólidos Gerados',
              },
              responsibleAgency: 'FEPAM',
              dueDate: '2026-05-20T00:00:00.000Z',
              status: 'Regular',
              riskLevel: 'REGULAR',
            },
          ],
        };
      }
    );

    renderConditionsPage();

    expect(
      await screen.findByText('2 condicionantes registradas')
    ).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Filtrar status' }));
    await user.click(screen.getByRole('option', { name: 'Risco' }));

    await waitFor(() =>
      expect(licenseConditionsApi.listLicenseConditions).toHaveBeenCalledWith(
        COMPANY_ID,
        'RISK'
      )
    );
    expect(
      await screen.findByText('1 condicionantes registradas')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('MTR - Manifesto de Transporte de Resíduos')
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'Filtrar status' }));
    await user.click(screen.getByRole('option', { name: 'Todos' }));

    await waitFor(() =>
      expect(
        licenseConditionsApi.listLicenseConditions
      ).toHaveBeenLastCalledWith(COMPANY_ID, 'all')
    );
    expect(
      await screen.findByText('2 condicionantes registradas')
    ).toBeInTheDocument();
    expect(
      screen.getByText('MTR - Manifesto de Transporte de Resíduos')
    ).toBeInTheDocument();
  });

  it('shows a filter-specific empty state and keeps the toolbar available', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockImplementation(
      async (_customerId, status) =>
        status === 'ATTENTION'
          ? { total: 0, conditions: [] }
          : { total: 1, conditions: [] }
    );

    renderConditionsPage();

    await screen.findByRole('combobox', { name: 'Filtrar status' });
    await user.click(screen.getByRole('combobox', { name: 'Filtrar status' }));
    await user.click(screen.getByRole('option', { name: 'Atenção' }));

    expect(
      await screen.findByText(
        'Nenhuma condicionante encontrada para o status selecionado.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText('0 condicionantes registradas')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'Filtrar status' })
    ).toBeInTheDocument();
  });

  it('shows field errors when name and due date are empty', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });

    renderConditionsPage();
    await user.click(
      screen.getByRole('button', { name: 'Novo Condicionante' })
    );
    const submitButton = screen.getByRole('button', {
      name: 'Cadastrar Condicionante',
    });
    await waitFor(() => expect(submitButton).toBeEnabled());
    await user.click(submitButton);

    expect(
      await screen.findByText('Informe o nome da condicionante.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Informe a data de vencimento.')
    ).toBeInTheDocument();
    expect(licenseConditionsApi.createLicenseCondition).not.toHaveBeenCalled();
  });

  it('creates a condition, closes the modal, shows a toast and refetches the cards and compliance', async () => {
    const user = userEvent.setup();
    const createdCondition = {
      id: 'condition-new',
      licenseId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'MTR - Manifesto de Transporte de Resíduos',
      description: 'Manifesto de transporte.',
      category: { id: 'metric-residuos', name: 'Resíduos Sólidos Gerados' },
      responsibleAgency: 'FEPAM',
      dueDate: '2099-05-20T00:00:00.000Z',
      status: 'Regular' as const,
      riskLevel: 'REGULAR' as const,
    };
    vi.mocked(licenseConditionsApi.listLicenseConditions)
      .mockResolvedValueOnce({ total: 0, conditions: [] })
      .mockResolvedValue({ total: 1, conditions: [createdCondition] });
    vi.mocked(licenseConditionsApi.getLicenseConditionsCompliance)
      .mockResolvedValueOnce({
        totalActive: 1,
        inCompliance: 0,
        compliancePercentage: 0,
      })
      .mockResolvedValue({
        totalActive: 2,
        inCompliance: 1,
        compliancePercentage: 50,
      });
    vi.mocked(licenseConditionsApi.createLicenseCondition).mockResolvedValue({
      id: createdCondition.id,
      license_id: createdCondition.licenseId,
      name: createdCondition.name,
      description: createdCondition.description,
      category: createdCondition.category,
      responsible_agency: createdCondition.responsibleAgency,
      due_date: createdCondition.dueDate,
      status: createdCondition.status,
      created_at: '2026-09-29T12:00:00.000Z',
    });

    renderConditionsPage();
    await screen.findByText(
      'Nenhuma condicionante cadastrada para esta empresa.'
    );

    await user.click(
      screen.getByRole('button', { name: 'Novo Condicionante' })
    );
    await screen.findByRole('dialog');

    await user.type(
      screen.getByLabelText('Nome da Condicionante'),
      createdCondition.name
    );
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Categoria' })).toBeEnabled()
    );
    await user.click(screen.getByRole('combobox', { name: 'Categoria' }));
    await user.click(
      screen.getByRole('option', { name: 'Resíduos Sólidos Gerados' })
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Licença Vinculada' })
    );
    await user.click(screen.getByRole('option', { name: 'LO nº 118/2020' }));
    await user.type(screen.getByLabelText('Órgão Responsável'), 'FEPAM');
    await user.type(screen.getByLabelText('Data de Vencimento'), '2099-05-20');
    await user.type(
      screen.getByLabelText('Descrição da Condicionante'),
      'Manifesto de transporte.'
    );
    await user.click(
      screen.getByRole('button', { name: 'Cadastrar Condicionante' })
    );

    await waitFor(() =>
      expect(licenseConditionsApi.createLicenseCondition).toHaveBeenCalledWith({
        name: createdCondition.name,
        esgMetricId: 'metric-residuos',
        licenseId: createdCondition.licenseId,
        responsibleAgency: 'FEPAM',
        dueDate: '2099-05-20T00:00:00.000Z',
        status: 'Regular',
        description: 'Manifesto de transporte.',
      })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        `Condicionante "${createdCondition.name}" cadastrada com sucesso.`
      )
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(licenseConditionsApi.listLicenseConditions).toHaveBeenCalledTimes(
        2
      )
    );
    expect(await screen.findByText(createdCondition.name)).toBeInTheDocument();
    expect(
      await screen.findByText('1 de 2 condicionantes em dia')
    ).toBeInTheDocument();
    expect(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).toHaveBeenCalledTimes(2);
  });
});

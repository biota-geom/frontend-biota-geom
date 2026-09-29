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
        },
      ],
    });
  });

  it('loads and renders the condition cards from the API', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([
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
    ]);

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
        COMPANY_ID
      )
    );

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
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([]);

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
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([]);
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
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([]);
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
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([]);
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

  it('shows the API error message when loading fails', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockRejectedValue(
      new ApiError(500, 'Não foi possível listar as condicionantes.')
    );

    renderConditionsPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível listar as condicionantes.'
    );
  });

  it('shows field errors when name and due date are empty', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([]);

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

  it('creates a condition, closes the modal, shows a toast and refetches the cards', async () => {
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
      .mockResolvedValueOnce([])
      .mockResolvedValue([createdCondition]);
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
  });
});

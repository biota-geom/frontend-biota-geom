import { screen, waitFor } from '@testing-library/react';
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
          category: 'Emissões',
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
          category: 'Resíduos',
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
                category: 'Emissões',
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
              category: 'Emissões',
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
              category: 'Resíduos',
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

  it('creates a condition, closes the modal, shows a toast and refetches the cards', async () => {
    const user = userEvent.setup();
    const createdCondition = {
      id: 'condition-new',
      licenseId: '550e8400-e29b-41d4-a716-446655440000',
      name: 'MTR - Manifesto de Transporte de Resíduos',
      description: 'Manifesto de transporte.',
      category: 'Resíduos',
      responsibleAgency: 'FEPAM',
      dueDate: '2099-05-20T00:00:00.000Z',
      status: 'Regular' as const,
      riskLevel: 'REGULAR' as const,
    };
    vi.mocked(licenseConditionsApi.listLicenseConditions)
      .mockResolvedValueOnce({ total: 0, conditions: [] })
      .mockResolvedValue({ total: 1, conditions: [createdCondition] });
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
    await user.click(screen.getByRole('combobox', { name: 'Categoria' }));
    await user.click(screen.getByRole('option', { name: 'Resíduos' }));
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
        category: 'Resíduos',
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

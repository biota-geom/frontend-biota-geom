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
  updateLicenseCondition: vi.fn(),
  deleteLicenseCondition: vi.fn(),
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
    vi.mocked(
      licenseConditionsApi.getLicenseConditionsCompliance
    ).mockResolvedValue({
      totalActive: 0,
      inCompliance: 0,
      compliancePercentage: 100,
    });
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
          environmentalDescriptor: 'Emissões',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-02-11T00:00:00.000Z',
          status: 'Regular',
          hasDelivery: true,
          isViolated: true,
          riskLevel: 'RISK',
        },
        {
          id: 'condition-regular',
          licenseId: 'license-1',
          name: 'MTR - Manifesto de Transporte de Resíduos',
          description: 'Emissão de manifesto obrigatório.',
          environmentalDescriptor: 'Resíduos Sólidos Gerados',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-05-20T00:00:00.000Z',
          status: 'Regular',
          hasDelivery: true,
          isViolated: false,
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
                environmentalDescriptor: 'Emissões',
                responsibleAgency: 'FEPAM',
                dueDate: '2026-02-11T00:00:00.000Z',
                status: 'Regular',
                hasDelivery: true,
                isViolated: true,
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
              environmentalDescriptor: 'Emissões',
              responsibleAgency: 'FEPAM',
              dueDate: '2026-02-11T00:00:00.000Z',
              status: 'Regular',
              hasDelivery: true,
              isViolated: true,
              riskLevel: 'RISK',
            },
            {
              id: 'condition-regular',
              licenseId: 'license-1',
              name: 'MTR - Manifesto de Transporte de Resíduos',
              description: 'Emissão de manifesto obrigatório.',
              environmentalDescriptor: 'Resíduos Sólidos Gerados',
              responsibleAgency: 'FEPAM',
              dueDate: '2026-05-20T00:00:00.000Z',
              status: 'Regular',
              hasDelivery: true,
              isViolated: false,
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

  it('does not offer a standalone condition creation entry point', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 0,
      conditions: [],
    });

    renderConditionsPage();

    expect(
      await screen.findByText(
        'Nenhuma condicionante cadastrada para esta empresa.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Novo Condicionante/ })
    ).not.toBeInTheDocument();
  });

  it('marks a condition as violated in the edit modal and displays the badge after reloading', async () => {
    const user = userEvent.setup();
    const condition = {
      id: 'condition-regular',
      licenseId: 'license-1',
      name: 'MTR mensal',
      description: 'Manifesto de transporte.',
      environmentalDescriptor: 'Resíduos sólidos',
      responsibleAgency: 'FEPAM',
      dueDate: '2026-11-30T00:00:00.000Z',
      status: 'Regular' as const,
      hasDelivery: true,
      isViolated: false,
      riskLevel: 'REGULAR' as const,
    };
    vi.mocked(licenseConditionsApi.listLicenseConditions)
      .mockResolvedValueOnce({ total: 1, conditions: [condition] })
      .mockResolvedValue({
        total: 1,
        conditions: [{ ...condition, isViolated: true }],
      });
    vi.mocked(licenseConditionsApi.updateLicenseCondition).mockResolvedValue();

    renderConditionsPage();
    await user.click(
      await screen.findByRole('button', { name: 'Editar MTR mensal' })
    );

    const dialog = screen.getByRole('dialog', { name: 'Editar Condicionante' });
    await user.click(within(dialog).getByRole('switch', { name: 'Violada' }));
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar Alterações' })
    );

    await waitFor(() =>
      expect(licenseConditionsApi.updateLicenseCondition).toHaveBeenCalledWith(
        condition.id,
        {
          name: condition.name,
          environmentalDescriptor: condition.environmentalDescriptor,
          responsibleAgency: condition.responsibleAgency,
          dueDate: condition.dueDate,
          hasDelivery: true,
          isViolated: true,
          description: condition.description,
        }
      )
    );
    expect(
      await within(
        screen.getByRole('article', { name: condition.name })
      ).findByText('Violada')
    ).toBeInTheDocument();
  });

  it('removes a condition after confirmation and reloads list and compliance', async () => {
    const user = userEvent.setup();
    const condition = {
      id: 'condition-regular',
      licenseId: 'license-1',
      name: 'MTR mensal',
      description: 'Manifesto de transporte.',
      environmentalDescriptor: 'Resíduos sólidos',
      responsibleAgency: 'FEPAM',
      dueDate: '2026-11-30T00:00:00.000Z',
      status: 'Regular' as const,
      hasDelivery: true,
      isViolated: false,
      riskLevel: 'REGULAR' as const,
    };
    vi.mocked(licenseConditionsApi.listLicenseConditions)
      .mockResolvedValueOnce({ total: 1, conditions: [condition] })
      .mockResolvedValue({ total: 0, conditions: [] });
    vi.mocked(licenseConditionsApi.deleteLicenseCondition).mockResolvedValue();

    renderConditionsPage();
    await user.click(
      await screen.findByRole('button', { name: 'Excluir MTR mensal' })
    );

    const dialog = screen.getByRole('dialog', {
      name: 'Remover condicionante',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Remover' }));

    await waitFor(() =>
      expect(licenseConditionsApi.deleteLicenseCondition).toHaveBeenCalledWith(
        'customer-1',
        'license-1',
        'condition-regular'
      )
    );
    // A barra de conformidade sai do cálculo junto com a condicionante.
    await waitFor(() =>
      expect(
        licenseConditionsApi.getLicenseConditionsCompliance
      ).toHaveBeenCalledTimes(2)
    );
    expect(
      await screen.findByText('0 condicionantes registradas')
    ).toBeInTheDocument();
  });

  it('keeps the condition when the confirmation is dismissed', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 1,
      conditions: [
        {
          id: 'condition-regular',
          licenseId: 'license-1',
          name: 'MTR mensal',
          description: 'Manifesto de transporte.',
          environmentalDescriptor: 'Resíduos sólidos',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-11-30T00:00:00.000Z',
          status: 'Regular' as const,
          hasDelivery: true,
          isViolated: false,
          riskLevel: 'REGULAR' as const,
        },
      ],
    });

    renderConditionsPage();
    await user.click(
      await screen.findByRole('button', { name: 'Excluir MTR mensal' })
    );
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    await waitFor(() =>
      expect(licenseConditionsApi.deleteLicenseCondition).not.toHaveBeenCalled()
    );
    expect(
      screen.getByRole('article', { name: 'MTR mensal' })
    ).toBeInTheDocument();
  });

  it('shows the API message and keeps the card when removal fails', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue({
      total: 1,
      conditions: [
        {
          id: 'condition-regular',
          licenseId: 'license-1',
          name: 'MTR mensal',
          description: 'Manifesto de transporte.',
          environmentalDescriptor: 'Resíduos sólidos',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-11-30T00:00:00.000Z',
          status: 'Regular' as const,
          hasDelivery: true,
          isViolated: false,
          riskLevel: 'REGULAR' as const,
        },
      ],
    });
    vi.mocked(licenseConditionsApi.deleteLicenseCondition).mockRejectedValue(
      new ApiError(404, 'Condicionante não encontrada.')
    );

    renderConditionsPage();
    await user.click(
      await screen.findByRole('button', { name: 'Excluir MTR mensal' })
    );
    await user.click(screen.getByRole('button', { name: 'Remover' }));

    expect(
      await screen.findByText('Condicionante não encontrada.')
    ).toBeInTheDocument();
    // O diálogo segue aberto e a listagem não é recarregada, então o card
    // continua lá por baixo do modal.
    expect(
      screen.getByRole('dialog', { name: 'Remover condicionante' })
    ).toBeInTheDocument();
    expect(licenseConditionsApi.listLicenseConditions).toHaveBeenCalledTimes(1);
  });
});

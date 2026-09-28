import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { buildCompanyRoutes } from '../../app/router/routes';
import type { Company } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import type { LicenseCondition } from '../../features/licenseConditions/types';
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
  updateLicenseCondition: vi.fn(),
  deleteLicenseCondition: vi.fn(),
}));
vi.mock('../../services/api/licensesApi', () => ({
  listLicenses: vi.fn(),
  createLicense: vi.fn(),
}));

const companiesApi = await import('../../services/api/companiesApi');
const customersApi = await import('../../services/api/customersApi');
const licenseConditionsApi =
  await import('../../services/api/licenseConditionsApi');
const licensesApi = await import('../../services/api/licensesApi');

const COMPANY_ID = 'customer-1';

const COMPANY_IN_CONTEXT: Company = {
  id: COMPANY_ID,
  name: 'Unidade Industrial Ouro Preto',
  status: 'active',
  segment: 'Mineração',
  location: 'Ouro Preto - MG',
};

const RISK_CONDITION: LicenseCondition = {
  id: 'condition-risk',
  licenseId: 'license-1',
  title: 'Automonitoramento Atmosférico',
  description: 'Avaliação periódica de emissões.',
  category: 'Emissões',
  dueDate: '2026-02-11T00:00:00.000Z',
  riskLevel: 'RISK',
};

const REGULAR_CONDITION: LicenseCondition = {
  id: 'condition-regular',
  licenseId: 'license-1',
  title: 'MTR - Manifesto de Transporte de Resíduos',
  description: 'Emissão de manifesto obrigatório.',
  category: 'Resíduos',
  dueDate: '2026-05-20T00:00:00.000Z',
  riskLevel: 'REGULAR',
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
          id: 'license-1',
          type: 'Licença de Operação (LO)',
          processNumber: 'LO nº 118/2020',
          issuingAgency: 'FEPAM',
          issueDate: '2020-01-10T00:00:00.000Z',
          expirationDate: '2027-01-10T00:00:00.000Z',
          status: 'Regular',
        },
      ],
    });
  });

  it('loads and renders the condition cards from the API', async () => {
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([
      RISK_CONDITION,
      REGULAR_CONDITION,
    ]);

    renderConditionsPage();

    expect(
      screen.getByRole('heading', {
        name: 'Monitor de Condicionantes Ambientais',
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
      screen.getByText('2 condicionantes registradas')
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

  it('asks for confirmation, removes the card and decreases the counter', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([
      RISK_CONDITION,
      REGULAR_CONDITION,
    ]);
    vi.mocked(licenseConditionsApi.deleteLicenseCondition).mockResolvedValue(
      undefined
    );

    renderConditionsPage();

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir Automonitoramento Atmosférico',
      })
    );

    expect(
      await screen.findByText(
        'Deseja remover esta condicionante? Esta ação não pode ser desfeita.'
      )
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remover' }));

    await waitFor(() =>
      expect(licenseConditionsApi.deleteLicenseCondition).toHaveBeenCalledWith(
        COMPANY_ID,
        'condition-risk'
      )
    );
    await waitFor(() =>
      expect(
        screen.queryByText('Automonitoramento Atmosférico')
      ).not.toBeInTheDocument()
    );
    expect(screen.getByText('1 condicionante registrada')).toBeInTheDocument();
  });

  it('puts the card back when the delete is refused', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([
      RISK_CONDITION,
      REGULAR_CONDITION,
    ]);
    vi.mocked(licenseConditionsApi.deleteLicenseCondition).mockRejectedValue(
      new ApiError(404, 'Condicionante inexistente.')
    );

    renderConditionsPage();

    await user.click(
      await screen.findByRole('button', {
        name: 'Excluir Automonitoramento Atmosférico',
      })
    );
    await user.click(await screen.findByRole('button', { name: 'Remover' }));

    expect(
      await screen.findByText('Condicionante inexistente.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Automonitoramento Atmosférico')
    ).toBeInTheDocument();
    expect(
      screen.getByText('2 condicionantes registradas')
    ).toBeInTheDocument();
  });

  it('repaints the card border with the risk level the API recalculated', async () => {
    const user = userEvent.setup();
    vi.mocked(licenseConditionsApi.listLicenseConditions).mockResolvedValue([
      RISK_CONDITION,
    ]);
    vi.mocked(licenseConditionsApi.updateLicenseCondition).mockResolvedValue({
      ...RISK_CONDITION,
      dueDate: '2026-12-31T00:00:00.000Z',
      riskLevel: 'REGULAR',
    });

    renderConditionsPage();

    await user.click(
      await screen.findByRole('button', {
        name: 'Editar Automonitoramento Atmosférico',
      })
    );
    fireEvent.change(await screen.findByLabelText('Data de Vencimento'), {
      target: { value: '2026-12-31' },
    });
    await user.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() =>
      expect(licenseConditionsApi.updateLicenseCondition).toHaveBeenCalledWith(
        COMPANY_ID,
        'condition-risk',
        expect.objectContaining({ dueDate: '2026-12-31' })
      )
    );
    await waitFor(() =>
      expect(
        screen.getByRole('article', { name: 'Automonitoramento Atmosférico' })
      ).toHaveClass('border-emerald-500')
    );
    expect(screen.getByText('31/12/2026')).toBeInTheDocument();
  });
});

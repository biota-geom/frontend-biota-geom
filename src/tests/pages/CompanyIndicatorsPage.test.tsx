import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { buildCompanyRoutes } from '../../app/router/routes';
import type { CompanyListItem } from '../../features/companies/types';
import { useCompanyContext } from '../../features/companies/useCompanyContext';
import { getPreviousMonth } from '../../features/esgIndicators/esgIndicatorsValidation';
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

const EMPTY_MONTH = {
  water: null,
  waste: null,
  employees: null,
  energy: null,
};

const SEPTEMBER = {
  water: 1250.5,
  waste: 12.3,
  employees: 148,
  energy: 53200,
};

function renderIndicatorsPage() {
  return renderWithAuth(<AppRoutes />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
    initialRoute: buildCompanyRoutes.indicators(COMPANY_ID),
  });
}

function monthInput() {
  return screen.getByLabelText('Mês de referência');
}

function waterInput() {
  return screen.getByLabelText('Consumo de Água');
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
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockResolvedValue(undefined);
  });

  it('opens on the month before the current one and loads its values', async () => {
    renderIndicatorsPage();

    const previousMonth = getPreviousMonth();
    expect(monthInput()).toHaveValue(previousMonth);
    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        previousMonth
      )
    );
    expect(
      screen.getByRole('heading', { name: 'Indicadores ESG' })
    ).toBeInTheDocument();
  });

  it('shows the four indicators with their units', async () => {
    renderIndicatorsPage();

    await waitFor(() => expect(waterInput()).toBeEnabled());
    expect(screen.getByLabelText('Resíduos Gerados')).toBeInTheDocument();
    expect(screen.getByLabelText('Nº de Funcionários')).toBeInTheDocument();
    expect(screen.getByLabelText('Consumo de Energia')).toBeInTheDocument();
    for (const unit of ['m³', 't', 'pessoas', 'kWh']) {
      expect(screen.getByText(unit)).toBeInTheDocument();
    }
  });

  it('opens pre-filled when the month already has data', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();

    await waitFor(() => expect(waterInput()).toHaveValue(1250.5));
    expect(screen.getByLabelText('Resíduos Gerados')).toHaveValue(12.3);
    expect(screen.getByLabelText('Nº de Funcionários')).toHaveValue(148);
    expect(screen.getByLabelText('Consumo de Energia')).toHaveValue(53200);
  });

  it('keeps the fields disabled while the month is loading', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockReturnValue(
      new Promise(() => {})
    );

    renderIndicatorsPage();

    expect(await screen.findByText('Carregando indicadores...')).toBeVisible();
    expect(waterInput()).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    ).toBeDisabled();
  });

  it('reloads the saved values when the month changes', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockImplementation(
      async (_companyId, month) =>
        month === '2026-09' ? SEPTEMBER : EMPTY_MONTH
    );

    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    fireEvent.change(monthInput(), { target: { value: '2026-09' } });

    await waitFor(() => expect(waterInput()).toHaveValue(1250.5));
    expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenLastCalledWith(
      COMPANY_ID,
      '2026-09'
    );

    fireEvent.change(monthInput(), { target: { value: '2026-08' } });

    await waitFor(() => expect(waterInput()).toHaveValue(null));
    expect(screen.getByLabelText('Nº de Funcionários')).toHaveValue(null);
  });

  it('saves the filled values, shows the success toast and keeps the form filled', async () => {
    const user = userEvent.setup();
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());
    fireEvent.change(monthInput(), { target: { value: '2026-09' } });
    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        '2026-09'
      )
    );
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.type(waterInput(), '1250.5');
    await user.type(screen.getByLabelText('Nº de Funcionários'), '148');
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        '2026-09',
        { water: 1250.5, employees: 148 }
      )
    );
    expect(
      await screen.findByText(
        'Indicadores de setembro de 2026 salvos com sucesso.'
      )
    ).toBeVisible();
    expect(waterInput()).toHaveValue(1250.5);
  });

  it('clears a saved indicator by sending null when its field is emptied', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toHaveValue(1250.5));

    await user.clear(waterInput());
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        getPreviousMonth(),
        { water: null, waste: 12.3, employees: 148, energy: 53200 }
      )
    );
  });

  it('remembers what it saved, so a value saved now can be cleared right after', async () => {
    const user = userEvent.setup();
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.type(waterInput(), '5');
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );
    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledTimes(1)
    );
    expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenLastCalledWith(
      COMPANY_ID,
      getPreviousMonth(),
      { water: 5 }
    );

    await user.type(screen.getByLabelText('Resíduos Gerados'), '2');
    await user.clear(waterInput());
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledTimes(2)
    );
    expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenLastCalledWith(
      COMPANY_ID,
      getPreviousMonth(),
      { water: null, waste: 2 }
    );
  });

  it('blocks a negative value without calling the API', async () => {
    const user = userEvent.setup();
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.type(waterInput(), '-3');
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText('O valor não pode ser negativo.')
    ).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('blocks a fractional number of employees without calling the API', async () => {
    const user = userEvent.setup();
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.type(screen.getByLabelText('Nº de Funcionários'), '10.5');
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(await screen.findByText('Informe um número inteiro.')).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('asks for at least one indicator when the whole form is blank', async () => {
    const user = userEvent.setup();
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText('Preencha ao menos um indicador para salvar.')
    ).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('shows the API message when saving fails and shows no toast', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockRejectedValue(
      new ApiError(400, 'O valor não pode ser negativo.')
    );
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.type(waterInput(), '10');
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText('O valor não pode ser negativo.')
    ).toBeVisible();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('falls back to a generic message when saving fails unexpectedly', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockRejectedValue(
      new Error('boom')
    );
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());

    await user.type(waterInput(), '10');
    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText(
        'Não foi possível salvar os indicadores. Tente novamente mais tarde.'
      )
    ).toBeVisible();
  });

  it('offers a retry when the month cannot be loaded', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockRejectedValueOnce(
      new ApiError(500, 'Falha no servidor.')
    );
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue(SEPTEMBER);

    renderIndicatorsPage();

    expect(await screen.findByText('Falha no servidor.')).toBeVisible();
    expect(waterInput()).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    ).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(waterInput()).toHaveValue(1250.5));
  });

  it('uses a generic message when loading fails with an unknown error', async () => {
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockRejectedValue(
      new Error('boom')
    );

    renderIndicatorsPage();

    expect(
      await screen.findByText(
        'Não foi possível carregar os indicadores deste mês.'
      )
    ).toBeVisible();
  });

  it('disables saving and skips the request while no month is selected', async () => {
    renderIndicatorsPage();
    await waitFor(() => expect(waterInput()).toBeEnabled());
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockClear();

    fireEvent.change(monthInput(), { target: { value: '' } });

    expect(await screen.findByText('Selecione um mês válido.')).toBeVisible();
    expect(waterInput()).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    ).toBeDisabled();
    expect(esgIndicatorsApi.getEsgIndicators).not.toHaveBeenCalled();
  });
});

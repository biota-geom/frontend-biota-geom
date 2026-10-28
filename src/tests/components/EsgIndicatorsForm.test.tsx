import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EsgIndicatorsForm } from '../../pages/company/Indicators/components/EsgIndicatorsForm';
import { ApiError } from '../../services/api/apiError';
import * as esgIndicatorsApi from '../../services/api/esgIndicatorsApi';
import type { MonthlyIndicator } from '../../features/esgIndicators/types';

vi.mock('../../services/api/esgIndicatorsApi', () => ({
  getEsgIndicators: vi.fn(),
  saveEsgIndicators: vi.fn(),
  createCustomerIndicator: vi.fn(),
}));

const COMPANY_ID = 'customer-1';
const MONTH = '2026-09';

const SEPTEMBER: MonthlyIndicator[] = [
  {
    indicator_id: 'uuid-ind-1',
    name: 'Consumo de Água',
    unit: 'm³',
    category: 'Ambiental',
    value: 1250.5,
  },
  {
    indicator_id: 'uuid-ind-2',
    name: 'Resíduos Totais',
    unit: 't',
    category: 'Ambiental',
    value: 12.3,
  },
  {
    indicator_id: 'uuid-ind-3',
    name: 'Número de Colaboradores',
    unit: 'un',
    category: 'Social',
    value: 148,
  },
];

// saveEsgIndicators returns the updated list
const UPDATED_RESPONSE: MonthlyIndicator[] = SEPTEMBER.map((ind) => ind);

function renderForm(props = {}) {
  const defaultProps = {
    companyId: COMPANY_ID,
    loadError: null,
    loadStatus: 'success' as const,
    month: MONTH,
    onIndicatorCreated: vi.fn(),
    onMonthChange: vi.fn(),
    onReload: vi.fn(),
    onSaved: vi.fn(),
    savedIndicators: SEPTEMBER,
    ...props,
  };
  return render(<EsgIndicatorsForm {...defaultProps} />);
}

describe('EsgIndicatorsForm', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockResolvedValue(
      UPDATED_RESPONSE
    );
  });

  it('renders dynamic field labels and prefilled values', () => {
    renderForm();

    expect(screen.getByLabelText('Consumo de Água')).toHaveValue(1250.5);
    expect(screen.getByLabelText('Resíduos Totais')).toHaveValue(12.3);
    expect(screen.getByLabelText('Número de Colaboradores')).toHaveValue(148);
  });

  it('blocks negative numbers', async () => {
    const user = userEvent.setup();
    renderForm();

    const waterInput = screen.getByLabelText('Consumo de Água');
    await user.clear(waterInput);
    await user.type(waterInput, '-10');

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText('O valor não pode ser negativo.')
    ).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('saves changes successfully via saveEsgIndicators with the records payload', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    renderForm({ onSaved });

    const waterInput = screen.getByLabelText('Consumo de Água');
    await user.clear(waterInput);
    await user.type(waterInput, '1300');

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        MONTH,
        expect.objectContaining({
          records: expect.arrayContaining([
            { indicator_id: 'uuid-ind-1', value: 1300 },
          ]),
        })
      )
    );
    expect(onSaved).toHaveBeenCalledWith(MONTH);
  });

  it('displays API error on failure', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockRejectedValue(
      new ApiError(400, 'Erro de validação na API')
    );
    renderForm();

    const waterInput = screen.getByLabelText('Consumo de Água');
    await user.clear(waterInput);
    await user.type(waterInput, '100');

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(await screen.findByText('Erro de validação na API')).toBeVisible();
  });

  it('shows "at least one indicator" error when all fields are blank with no saved value', async () => {
    const user = userEvent.setup();
    // No indicators configured
    renderForm({ savedIndicators: [] });

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText('Preencha ao menos um indicador para salvar.')
    ).toBeVisible();
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EsgIndicatorsForm } from '../../pages/company/Indicators/components/EsgIndicatorsForm';
import { ApiError } from '../../services/api/apiError';
import * as esgIndicatorsApi from '../../services/api/esgIndicatorsApi';

vi.mock('../../services/api/esgIndicatorsApi', () => ({
  getEsgIndicators: vi.fn(),
  saveEsgIndicators: vi.fn(),
}));

const COMPANY_ID = 'customer-1';
const MONTH = '2026-09';
const SEPTEMBER = {
  water: 1250.5,
  waste: 12.3,
  employees: 148,
  energy: 53200,
};

function renderForm(props = {}) {
  const defaultProps = {
    companyId: COMPANY_ID,
    loadError: null,
    loadStatus: 'success' as const,
    month: MONTH,
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
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockResolvedValue(undefined);
  });

  it('renders prefilled form values and field labels', () => {
    renderForm();

    expect(screen.getByLabelText('Consumo de Água')).toHaveValue(1250.5);
    expect(screen.getByLabelText('Resíduos Gerados')).toHaveValue(12.3);
    expect(screen.getByLabelText('Nº de Funcionários')).toHaveValue(148);
    expect(screen.getByLabelText('Consumo de Energia')).toHaveValue(53200);
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

  it('blocks non-integer employees', async () => {
    const user = userEvent.setup();
    renderForm();

    const empInput = screen.getByLabelText('Nº de Funcionários');
    await user.clear(empInput);
    await user.type(empInput, '10.5');

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(await screen.findByText('Informe um número inteiro.')).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('saves changes successfully via saveEsgIndicators', async () => {
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
        {
          water: 1300,
          waste: 12.3,
          employees: 148,
          energy: 53200,
        }
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

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(await screen.findByText('Erro de validação na API')).toBeVisible();
  });

  it('handles empty save attempt', async () => {
    const user = userEvent.setup();
    renderForm({ savedIndicators: null });

    await user.click(
      screen.getByRole('button', { name: 'Salvar indicadores' })
    );

    expect(
      await screen.findByText('Preencha ao menos um indicador para salvar.')
    ).toBeVisible();
  });
});

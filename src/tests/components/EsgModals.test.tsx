import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateReportModal } from '../../pages/company/Indicators/components/GenerateReportModal';
import { NewEsgIndicatorModal } from '../../pages/company/Indicators/components/NewEsgIndicatorModal';
import { ApiError } from '../../services/api/apiError';
import * as esgIndicatorsApi from '../../services/api/esgIndicatorsApi';

vi.mock('../../services/api/esgIndicatorsApi', () => ({
  getEsgIndicators: vi.fn(),
  saveEsgIndicators: vi.fn(),
}));

const COMPANY_ID = 'customer-1';
const MONTH = '2026-09';

describe('NewEsgIndicatorModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockResolvedValue(undefined);
  });

  it('renders with default fields and pre-fills value if savedIndicators is provided', () => {
    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={{
          water: 1250.5,
          waste: null,
          employees: null,
          energy: null,
        }}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Novo Registro de Indicador' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Mês de Referência')).toHaveValue(MONTH);
    expect(screen.getByLabelText('Valor Medido')).toHaveValue(1250.5);
  });

  it('allows switching to "Todos os Indicadores" and validates integer for employees', async () => {
    const user = userEvent.setup();
    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
      />
    );

    // Open select dropdown and choose "Todos os Indicadores"
    const selectTrigger = screen.getByLabelText('Indicador');
    await user.click(selectTrigger);

    const allOption = await screen.findByRole('option', {
      name: 'Todos os Indicadores',
    });
    await user.click(allOption);

    // Now all 4 inputs are visible
    const empInput = screen.getByLabelText(/Nº de Funcionários/i);
    expect(empInput).toBeInTheDocument();

    await user.type(empInput, '148.5');
    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    expect(await screen.findByText(/Informe um número inteiro/i)).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('submits all indicators when in bulk mode', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={onOpenChange}
        onSaved={onSaved}
        open={true}
      />
    );

    const selectTrigger = screen.getByLabelText('Indicador');
    await user.click(selectTrigger);

    const allOption = await screen.findByRole('option', {
      name: 'Todos os Indicadores',
    });
    await user.click(allOption);

    await user.type(screen.getByLabelText(/Consumo de Água/i), '1200');
    await user.type(screen.getByLabelText(/Resíduos Gerados/i), '45.5');
    await user.type(screen.getByLabelText(/Nº de Funcionários/i), '50');

    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        MONTH,
        {
          water: 1200,
          waste: 45.5,
          employees: 50,
        }
      )
    );
    expect(onSaved).toHaveBeenCalledWith(MONTH, undefined);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe('GenerateReportModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue({
      water: 1000,
      waste: 20,
      employees: 30,
      energy: 4000,
    });
  });

  it('renders month input and calls getEsgIndicators on submit', async () => {
    const user = userEvent.setup();
    const onGenerated = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <GenerateReportModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onGenerated={onGenerated}
        onOpenChange={onOpenChange}
        open={true}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Gerar Relatório de Indicadores' })
    ).toBeInTheDocument();

    const monthInput = screen.getByLabelText('Mês de Referência');
    expect(monthInput).toHaveValue(MONTH);

    await user.click(screen.getByRole('button', { name: 'Gerar Relatório' }));

    await waitFor(() =>
      expect(esgIndicatorsApi.getEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        MONTH
      )
    );
    expect(onGenerated).toHaveBeenCalledWith(MONTH, {
      water: 1000,
      waste: 20,
      employees: 30,
      energy: 4000,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('displays error message when getEsgIndicators fails', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockRejectedValue(
      new ApiError(404, 'Empresa não encontrada.')
    );

    render(
      <GenerateReportModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onGenerated={vi.fn()}
        onOpenChange={vi.fn()}
        open={true}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Gerar Relatório' }));

    expect(await screen.findByText('Empresa não encontrada.')).toBeVisible();
  });
});

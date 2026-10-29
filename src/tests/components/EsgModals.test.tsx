import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GenerateReportModal } from '../../pages/company/Indicators/components/GenerateReportModal';
import { NewEsgIndicatorModal } from '../../pages/company/Indicators/components/NewEsgIndicatorModal';
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

const SAVED_INDICATORS: MonthlyIndicator[] = [
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
    value: null,
  },
];

describe('NewEsgIndicatorModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockResolvedValue([]);
    vi.mocked(esgIndicatorsApi.createCustomerIndicator).mockResolvedValue({
      indicator_id: 'uuid-new',
      name: 'Geração de Efluentes',
      unit: 'm³',
      category: 'Ambiental',
      value: null,
    });
  });

  it('renders heading and month input', () => {
    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={SAVED_INDICATORS}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Novo Registro de Indicador' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Mês de Referência')).toHaveValue(MONTH);
  });

  it('renders dynamic indicator fields from savedIndicators', () => {
    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={SAVED_INDICATORS}
      />
    );

    expect(screen.getByLabelText(/Consumo de Água/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Resíduos Totais/i)).toBeInTheDocument();
  });

  it('submits filled indicators with the records payload', async () => {
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
        savedIndicators={SAVED_INDICATORS}
      />
    );

    await user.type(screen.getByLabelText(/Resíduos Totais/i), '45.5');

    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    await waitFor(() =>
      expect(esgIndicatorsApi.saveEsgIndicators).toHaveBeenCalledWith(
        COMPANY_ID,
        MONTH,
        expect.objectContaining({
          records: expect.arrayContaining([
            { indicator_id: 'uuid-ind-2', value: 45.5 },
          ]),
        })
      )
    );
    expect(onSaved).toHaveBeenCalledWith(MONTH);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('blocks negative values without calling PUT', async () => {
    const user = userEvent.setup();

    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={SAVED_INDICATORS}
      />
    );

    const waterInput = screen.getByLabelText(/Consumo de Água/i);
    await user.clear(waterInput);
    await user.type(waterInput, '-10');

    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    expect(
      await screen.findByText('O valor não pode ser negativo.')
    ).toBeVisible();
    expect(esgIndicatorsApi.saveEsgIndicators).not.toHaveBeenCalled();
  });

  it('shows "+ Novo Indicador" button and opens creation sub-form', async () => {
    const user = userEvent.setup();

    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={SAVED_INDICATORS}
      />
    );

    await user.click(screen.getByRole('button', { name: '+ Novo Indicador' }));

    expect(screen.getByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Unidade')).toBeInTheDocument();
    expect(screen.getByLabelText('Categoria do indicador')).toBeInTheDocument();
  });

  it('creates a new indicator inline and adds it to the form', async () => {
    const user = userEvent.setup();

    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={SAVED_INDICATORS}
      />
    );

    await user.click(screen.getByRole('button', { name: '+ Novo Indicador' }));

    await user.type(screen.getByLabelText('Nome'), 'Geração de Efluentes');
    await user.type(screen.getByLabelText('Unidade'), 'm³');

    await user.click(screen.getByRole('button', { name: 'Criar Indicador' }));

    await waitFor(() =>
      expect(esgIndicatorsApi.createCustomerIndicator).toHaveBeenCalledWith(
        COMPANY_ID,
        { name: 'Geração de Efluentes', unit: 'm³', category: 'Ambiental' }
      )
    );

    // New field appears in the form
    expect(
      await screen.findByLabelText(/Geração de Efluentes/i)
    ).toBeInTheDocument();
  });

  it('displays API error inside modal when PUT fails', async () => {
    const user = userEvent.setup();
    vi.mocked(esgIndicatorsApi.saveEsgIndicators).mockRejectedValue(
      new ApiError(400, 'Erro retornado pela API.')
    );

    render(
      <NewEsgIndicatorModal
        companyId={COMPANY_ID}
        initialMonth={MONTH}
        onOpenChange={vi.fn()}
        onSaved={vi.fn()}
        open={true}
        savedIndicators={SAVED_INDICATORS}
      />
    );

    const waterInput = screen.getByLabelText(/Consumo de Água/i);
    await user.type(waterInput, '500');

    await user.click(screen.getByRole('button', { name: 'Registrar Dados' }));

    expect(await screen.findByText('Erro retornado pela API.')).toBeVisible();
  });
});

describe('GenerateReportModal', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(esgIndicatorsApi.getEsgIndicators).mockResolvedValue([
      {
        indicator_id: 'uuid-ind-1',
        name: 'Consumo de Água',
        unit: 'm³',
        category: 'Ambiental',
        value: 1000,
      },
    ]);
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
    expect(onGenerated).toHaveBeenCalledWith(
      MONTH,
      expect.arrayContaining([
        expect.objectContaining({ indicator_id: 'uuid-ind-1', value: 1000 }),
      ])
    );
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

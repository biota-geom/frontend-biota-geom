import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EsgIndicatorsSummary } from '../../features/esgIndicators/types';
import { EsgIndicatorsDashboardCard } from '../../pages/company/Dashboard/components/EsgIndicatorsDashboardCard';
import { ApiError } from '../../services/api/apiError';
import { getEsgIndicatorsSummary } from '../../services/api/esgIndicatorsApi';

vi.mock('../../services/api/esgIndicatorsApi', () => ({
  getEsgIndicatorsSummary: vi.fn(),
}));

const mockedGetSummary = vi.mocked(getEsgIndicatorsSummary);

const SEPTEMBER: EsgIndicatorsSummary = {
  reference_month: '2026-09',
  indicators: [
    {
      indicator_id: 'ind-1',
      name: 'Consumo de Água',
      unit: 'm³',
      category: 'Ambiental',
      current: 1100,
      previous: 1000,
      variation_pct: 10,
    },
    {
      indicator_id: 'ind-2',
      name: 'Colaboradores',
      unit: 'un',
      category: 'Social',
      current: 148,
      previous: 150,
      variation_pct: -1.3,
    },
  ],
};

function renderCard() {
  return render(
    <MemoryRouter>
      <EsgIndicatorsDashboardCard companyId="company-1" />
    </MemoryRouter>
  );
}

function getCard() {
  return screen.getByRole('article', { name: 'Indicadores ESG' });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EsgIndicatorsDashboardCard', () => {
  it('shows the latest month summary, as the Indicators page does', async () => {
    mockedGetSummary.mockResolvedValue(SEPTEMBER);

    renderCard();

    expect(screen.getByRole('status')).toHaveTextContent(
      'Carregando indicadores ESG...'
    );
    expect(
      await screen.findByLabelText('Consumo de Água: 1.100 m³')
    ).toBeInTheDocument();
    // Sem mês: o backend usa o último mês com registro, como a tela de ESG
    expect(mockedGetSummary).toHaveBeenCalledWith('company-1', undefined);
    expect(
      screen.getByText('Referência: setembro de 2026')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Variação de Consumo de Água: ▲ 10,0%')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Variação de Colaboradores: ▼ 1,3%')
    ).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(
      within(getCard()).queryByText('Nenhum indicador registrado.')
    ).not.toBeInTheDocument();
  });

  it('links to the Indicators page to register new values', async () => {
    mockedGetSummary.mockResolvedValue(SEPTEMBER);

    renderCard();

    expect(
      await screen.findByRole('link', { name: /registrar indicadores/i })
    ).toHaveAttribute('href', '/companies/company-1/indicators');
  });

  it('shows the empty state when the company has no ESG record', async () => {
    mockedGetSummary.mockResolvedValue({
      reference_month: null,
      indicators: [
        { ...SEPTEMBER.indicators[0], current: null, variation_pct: null },
      ],
    });

    renderCard();

    expect(
      await screen.findByText('Nenhum indicador registrado.')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: 'Resumo dos indicadores ESG' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /registrar indicadores/i })
    ).toHaveAttribute('href', '/companies/company-1/indicators');
  });

  it('shows the empty state when the company has no indicator at all', async () => {
    mockedGetSummary.mockResolvedValue({
      reference_month: '2026-09',
      indicators: [],
    });

    renderCard();

    expect(
      await screen.findByText('Nenhum indicador registrado.')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Nenhum indicador configurado para esta empresa.')
    ).not.toBeInTheDocument();
  });

  it('shows the API error and retries the request', async () => {
    mockedGetSummary
      .mockRejectedValueOnce(new ApiError(500, 'Falha no servidor'))
      .mockResolvedValueOnce(SEPTEMBER);

    const user = userEvent.setup();
    renderCard();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha no servidor'
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByLabelText('Consumo de Água: 1.100 m³')
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(mockedGetSummary).toHaveBeenCalledTimes(2);
  });

  it('falls back to a generic message on an unexpected error', async () => {
    mockedGetSummary.mockRejectedValue(new Error('network error'));

    renderCard();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar o resumo dos indicadores.'
    );
    expect(
      screen.queryByText('Nenhum indicador registrado.')
    ).not.toBeInTheDocument();
  });
});

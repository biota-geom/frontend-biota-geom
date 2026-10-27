import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EsgKpiGrid } from '../../components/esg/EsgKpiGrid';
import type { EsgIndicatorsSummary } from '../../features/esgIndicators/types';

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
      name: 'Resíduos Gerados',
      unit: 't',
      category: 'Ambiental',
      current: 12.3,
      previous: null,
      variation_pct: null,
    },
    {
      indicator_id: 'ind-3',
      name: 'Colaboradores',
      unit: 'un',
      category: 'Social',
      current: 148,
      previous: 150,
      variation_pct: -1.3,
    },
  ],
};

describe('EsgKpiGrid', () => {
  it('renders one card per indicator of the company', () => {
    render(<EsgKpiGrid summary={SEPTEMBER} />);

    expect(screen.getAllByTestId(/^esg-kpi-card-/)).toHaveLength(3);
  });

  it('shows water going from 1000 to 1100 as ▲ 10,0%', () => {
    render(<EsgKpiGrid summary={SEPTEMBER} />);

    expect(
      screen.getByLabelText('Consumo de Água: 1.100 m³')
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText('Variação de Consumo de Água: ▲ 10,0%')
    ).toBeInTheDocument();
  });

  it('shows a decrease with a down arrow', () => {
    render(<EsgKpiGrid summary={SEPTEMBER} />);

    expect(
      screen.getByLabelText('Variação de Colaboradores: ▼ 1,3%')
    ).toBeInTheDocument();
  });

  it('shows "—" for a month without a previous record', () => {
    render(<EsgKpiGrid summary={SEPTEMBER} />);

    expect(screen.getByLabelText('Resíduos Gerados: 12,3 t')).toBeVisible();
    expect(
      screen.getByLabelText('Variação de Resíduos Gerados: —')
    ).toBeInTheDocument();
  });

  it('names the reference month of the cards', () => {
    render(<EsgKpiGrid summary={SEPTEMBER} />);

    expect(screen.getByText('Referência: setembro de 2026')).toBeVisible();
  });

  it('shows "—" in every card of a company without records', () => {
    render(
      <EsgKpiGrid
        summary={{
          reference_month: null,
          indicators: [
            {
              ...SEPTEMBER.indicators[0],
              current: null,
              previous: null,
              variation_pct: null,
            },
          ],
        }}
      />
    );

    expect(screen.getByLabelText('Consumo de Água: —')).toBeInTheDocument();
    expect(
      screen.getByLabelText('Variação de Consumo de Água: —')
    ).toBeInTheDocument();
    expect(screen.queryByText(/Referência:/)).not.toBeInTheDocument();
  });

  it('says so when the company has no indicator configured', () => {
    render(<EsgKpiGrid summary={{ reference_month: null, indicators: [] }} />);

    expect(
      screen.getByText('Nenhum indicador configurado para esta empresa.')
    ).toBeVisible();
  });

  it('renders nothing while there is no summary', () => {
    const { container } = render(<EsgKpiGrid summary={null} />);

    expect(container).toBeEmptyDOMElement();
  });
});

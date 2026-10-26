import { MOCK_ESG_HISTORICAL_DATA } from '../../../../features/esgIndicators/esgIndicators.mock';
import type { MonthlyIndicator } from '../../../../features/esgIndicators/types';
import type { EsgSeries } from '../../../../features/esgIndicators/useEsgHistory';
import { EsgChartCard } from './EsgChartCard';

type EsgChartsGridProps = {
  indicators: MonthlyIndicator[] | null;
  /** Chart line per indicator_id (see useEsgHistory). */
  series: Record<string, EsgSeries>;
};

export function EsgChartsGrid({ indicators, series }: EsgChartsGridProps) {
  const hasCompanyIndicators = Boolean(indicators && indicators.length > 0);

  return (
    <div
      aria-label="Gráficos de indicadores ESG"
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      {hasCompanyIndicators && indicators
        ? // One chart per indicator the company reports (including the ones
          // created inline), built from its saved monthly values.
          indicators.map((indicator) => {
            const line = series[indicator.indicator_id] ?? {
              labels: [],
              data: [],
            };

            return (
              <EsgChartCard
                data={line.data}
                key={indicator.indicator_id}
                labels={line.labels}
                legend={`${indicator.name} (${indicator.unit})`}
                title={`${indicator.name} (${indicator.unit}/mês)`}
                unit={indicator.unit}
              />
            );
          })
        : // No indicators loaded yet (or the company has none): static
          // placeholder charts so the layout is never empty.
          MOCK_ESG_HISTORICAL_DATA.map((mock) => (
            <EsgChartCard
              data={mock.data}
              key={mock.indicator_id}
              labels={mock.labels}
              legend={mock.legend}
              title={mock.chartTitle}
              unit={mock.unit}
            />
          ))}
    </div>
  );
}

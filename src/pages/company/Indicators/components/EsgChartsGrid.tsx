import {
  MOCK_DEFAULT_MONTHLY_INDICATORS,
  MOCK_ESG_HISTORICAL_DATA,
} from '../../../../features/esgIndicators/esgIndicators.mock';
import type { MonthlyIndicator } from '../../../../features/esgIndicators/types';
import { EsgChartCard } from './EsgChartCard';

type EsgChartsGridProps = {
  indicators: MonthlyIndicator[] | null;
};

export function EsgChartsGrid({ indicators }: EsgChartsGridProps) {
  /*
   * Charts always display the 4 static mock series for now (historical data
   * is not yet backed by the real API). The real current-month value is
   * spliced into the last position of each series so the chart reflects what
   * was just registered.
   */
  const display =
    indicators && indicators.length > 0
      ? indicators
      : MOCK_DEFAULT_MONTHLY_INDICATORS;

  return (
    <div
      aria-label="Gráficos de indicadores ESG"
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      {MOCK_ESG_HISTORICAL_DATA.map((series) => {
        /*
         * Find the real value for this indicator from the loaded data, if any.
         * Fall back to the series' own currentValue when there's no match.
         */
        const live = display.find(
          (ind) => ind.indicator_id === series.indicator_id
        );
        const currentValue = live?.value ?? series.currentValue;

        const data = [...series.data.slice(0, -1), currentValue];

        return (
          <EsgChartCard
            data={data}
            key={series.indicator_id}
            labels={series.labels}
            legend={series.legend}
            title={series.chartTitle}
            unit={series.unit}
          />
        );
      })}
    </div>
  );
}

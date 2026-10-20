import { MOCK_ESG_HISTORICAL_DATA } from '../../../../features/esgIndicators/esgIndicators.mock';
import {
  ESG_INDICATOR_KEYS,
  type EsgIndicatorKey,
  type EsgMonthlyIndicators,
} from '../../../../features/esgIndicators/types';
import { EsgChartCard } from './EsgChartCard';

type EsgChartsGridProps = {
  indicators: EsgMonthlyIndicators | null;
};

export function EsgChartsGrid({ indicators }: EsgChartsGridProps) {
  return (
    <div
      aria-label="Gráficos de indicadores ESG"
      className="grid grid-cols-1 gap-6 lg:grid-cols-2"
    >
      {ESG_INDICATOR_KEYS.map((key: EsgIndicatorKey) => {
        const series = MOCK_ESG_HISTORICAL_DATA[key];
        const data = [...series.data];

        // If real data was loaded, reflect the current month's value at the end of the series
        const currentValue = indicators?.[key];
        if (currentValue !== null && currentValue !== undefined) {
          data[data.length - 1] = currentValue;
        }

        return (
          <EsgChartCard
            data={data}
            key={key}
            labels={series.labels}
            legend={series.legend}
            title={series.chartTitle}
          />
        );
      })}
    </div>
  );
}

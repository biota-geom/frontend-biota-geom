import {
  MOCK_DEFAULT_MONTHLY_INDICATORS,
  MOCK_ESG_HISTORICAL_DATA,
} from '../../../../features/esgIndicators/esgIndicators.mock';
import { formatEsgValue } from '../../../../features/esgIndicators/esgIndicatorsFormatting';
import type { MonthlyIndicator } from '../../../../features/esgIndicators/types';

type EsgSummaryCardsProps = {
  indicators: MonthlyIndicator[] | null;
};

export function EsgSummaryCards({ indicators }: EsgSummaryCardsProps) {
  /*
   * When real data is loaded, display it. Otherwise fall back to the static
   * mock placeholders so the layout is never empty.
   */
  const display =
    indicators && indicators.length > 0
      ? indicators
      : MOCK_DEFAULT_MONTHLY_INDICATORS;

  return (
    <div
      aria-label="Resumo dos indicadores ESG"
      className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {display.map((indicator) => {
        const displayValue = formatEsgValue(indicator.value, indicator.unit);

        /*
         * Look up mock trend data by indicator_id so the chart cards keep
         * their animated trend arrows. Falls back to a neutral placeholder
         * for indicators that aren't in the static mock set.
         */
        const mockSeries = MOCK_ESG_HISTORICAL_DATA.find(
          (s) => s.indicator_id === indicator.indicator_id
        );
        const trend = mockSeries?.trend ?? {
          direction: 'up' as const,
          isPositive: true,
          label: '—',
        };
        const { direction, isPositive, label } = trend;

        return (
          <div
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-control"
            data-testid={`esg-summary-card-${indicator.indicator_id}`}
            key={indicator.indicator_id}
          >
            <div>
              <span className="text-sm font-medium text-text-secondary">
                {indicator.name}
              </span>
              <p
                aria-label={`${indicator.name}: ${displayValue}`}
                className="mt-1.5 mb-2 text-2xl font-bold tracking-tight text-text-primary lg:text-[28px]"
              >
                {displayValue}
              </p>
            </div>
            <div
              className={`inline-flex items-center gap-1 text-xs font-semibold ${
                isPositive ? 'text-primary-strong' : 'text-destructive'
              }`}
            >
              <span>{direction === 'down' ? '↓' : '↑'}</span>
              <span>{label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

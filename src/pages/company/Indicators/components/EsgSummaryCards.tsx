import {
  MOCK_DEFAULT_MONTHLY_INDICATORS,
  MOCK_ESG_HISTORICAL_DATA,
} from '../../../../features/esgIndicators/esgIndicators.mock';
import { formatEsgValue } from '../../../../features/esgIndicators/esgIndicatorsFormatting';
import {
  ESG_INDICATOR_KEYS,
  type EsgIndicatorKey,
  type EsgMonthlyIndicators,
} from '../../../../features/esgIndicators/types';

type EsgSummaryCardsProps = {
  indicators: EsgMonthlyIndicators | null;
};

export function EsgSummaryCards({ indicators }: EsgSummaryCardsProps) {
  return (
    <div
      aria-label="Resumo dos indicadores ESG"
      className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {ESG_INDICATOR_KEYS.map((key: EsgIndicatorKey) => {
        const meta = MOCK_ESG_HISTORICAL_DATA[key];
        const rawValue = indicators
          ? indicators[key]
          : MOCK_DEFAULT_MONTHLY_INDICATORS[key];
        const displayValue = formatEsgValue(rawValue, key);
        const { direction, isPositive, label } = meta.trend;

        return (
          <div
            className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-control"
            data-testid={`esg-summary-card-${key}`}
            key={key}
          >
            <div>
              <span className="text-sm font-medium text-text-secondary">
                {meta.title}
              </span>
              <p
                aria-label={`${meta.title}: ${displayValue}`}
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

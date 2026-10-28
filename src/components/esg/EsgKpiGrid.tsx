import {
  formatEsgValue,
  formatEsgVariation,
} from '../../features/esgIndicators/esgIndicatorsFormatting';
import { formatMonthLabel } from '../../features/esgIndicators/esgIndicatorsValidation';
import type { EsgIndicatorsSummary } from '../../features/esgIndicators/types';
import { cn } from '../../utils/cn';

/*
 * On the Indicators page the grid sits above the charts and keeps its own
 * bottom margin; inside a Control Panel card the card's gap does the spacing.
 */
const GRID_SPACING = {
  page: 'mb-8',
  dashboard: '',
} as const;

const GRID_COLUMNS = {
  page: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  dashboard: 'grid-cols-1 sm:grid-cols-2',
} as const;

const KPI_CARD_STYLE = {
  page: 'bg-surface p-6',
  dashboard: 'bg-surface-muted p-4',
} as const;

type EsgKpiGridProps = {
  /** Null while loading or on error: the grid stays empty until it arrives. */
  summary: EsgIndicatorsSummary | null;
  variant?: keyof typeof GRID_SPACING;
};

/*
 * One KPI card per indicator of the company: value of the month and change
 * against the month before. Purely presentational so the same grid can be
 * reused by the Indicators page, the Control Panel and the PDF report.
 */
export function EsgKpiGrid({ summary, variant = 'page' }: EsgKpiGridProps) {
  if (!summary) return null;

  const spacing = GRID_SPACING[variant];
  const columns = GRID_COLUMNS[variant];
  const cardStyle = KPI_CARD_STYLE[variant];

  if (summary.indicators.length === 0) {
    return (
      <p className={cn('text-sm text-text-secondary', spacing)}>
        Nenhum indicador configurado para esta empresa.
      </p>
    );
  }

  return (
    <section aria-label="Resumo dos indicadores ESG" className={spacing}>
      {summary.reference_month && (
        <p className="mb-3 text-sm text-text-secondary">
          Referência: {formatMonthLabel(summary.reference_month)}
        </p>
      )}
      <div className={cn('grid gap-3', columns)}>
        {summary.indicators.map((indicator) => {
          const displayValue = formatEsgValue(
            indicator.current,
            indicator.unit
          );
          const variation = formatEsgVariation(indicator.variation_pct);
          const variationColor =
            indicator.variation_pct === null || indicator.variation_pct === 0
              ? 'text-text-secondary'
              : indicator.variation_pct > 0
                ? 'text-primary-strong'
                : 'text-red-600';

          return (
            <div
              className={cn(
                'flex flex-col justify-between rounded-xl border border-border shadow-control',
                cardStyle
              )}
              data-testid={`esg-kpi-card-${indicator.indicator_id}`}
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
              <p
                aria-label={`Variação de ${indicator.name}: ${variation}`}
                className={cn('text-xs font-semibold', variationColor)}
              >
                {variation}
                <span className="font-normal"> vs mês anterior</span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

import {
  formatEsgValue,
  formatEsgVariation,
} from '../../features/esgIndicators/esgIndicatorsFormatting';
import { formatMonthLabel } from '../../features/esgIndicators/esgIndicatorsValidation';
import type { EsgIndicatorsSummary } from '../../features/esgIndicators/types';

type EsgKpiGridProps = {
  /** Null while loading or on error: the grid stays empty until it arrives. */
  summary: EsgIndicatorsSummary | null;
};

/*
 * One KPI card per indicator of the company: value of the month and change
 * against the month before. Purely presentational so the same grid can be
 * reused by the Indicators page, the Control Panel and the PDF report.
 */
export function EsgKpiGrid({ summary }: EsgKpiGridProps) {
  if (!summary) return null;

  if (summary.indicators.length === 0) {
    return (
      <p className="mb-8 text-sm text-text-secondary">
        Nenhum indicador configurado para esta empresa.
      </p>
    );
  }

  return (
    <section aria-label="Resumo dos indicadores ESG" className="mb-8">
      {summary.reference_month && (
        <p className="mb-3 text-sm text-text-secondary">
          Referência: {formatMonthLabel(summary.reference_month)}
        </p>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {summary.indicators.map((indicator) => {
          const displayValue = formatEsgValue(
            indicator.current,
            indicator.unit
          );
          const variation = formatEsgVariation(indicator.variation_pct);

          return (
            <div
              className="flex flex-col justify-between rounded-xl border border-border bg-surface p-6 shadow-control"
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
                className="text-xs font-semibold text-text-secondary"
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

import { useEffect, useState } from 'react';
import { getEsgIndicators } from '../../services/api/esgIndicatorsApi';
import { isValidMonth } from './esgIndicatorsValidation';
import type { MonthlyIndicator } from './types';

/** Months shown on each chart: the selected month plus the 5 before it. */
export const HISTORY_MONTHS = 6;

const SHORT_MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

/** One chart line: only months that have a recorded value are included. */
export type EsgSeries = {
  labels: string[];
  data: number[];
};

// month ("YYYY-MM") -> indicator_id -> recorded value
type PreviousValues = Map<string, Map<string, number>>;

/** "2026-09" -> ["2026-04", ..., "2026-09"] (oldest first, ends at `month`). */
export function getMonthWindow(month: string, size = HISTORY_MONTHS): string[] {
  const [year, monthNumber] = month.split('-').map(Number);

  return Array.from({ length: size }, (_, index) => {
    const date = new Date(year, monthNumber - 1 - (size - 1 - index), 1);
    const monthPart = String(date.getMonth() + 1).padStart(2, '0');
    return `${date.getFullYear()}-${monthPart}`;
  });
}

function formatShortMonth(month: string): string {
  return SHORT_MONTH_LABELS[Number(month.slice(5, 7)) - 1] ?? month;
}

function buildSeries(
  windowMonths: string[],
  previous: PreviousValues | null,
  indicators: MonthlyIndicator[]
): Record<string, EsgSeries> {
  const currentMonth = windowMonths[windowMonths.length - 1];
  const series: Record<string, EsgSeries> = {};

  for (const indicator of indicators) {
    const labels: string[] = [];
    const data: number[] = [];

    for (const month of windowMonths) {
      const value =
        month === currentMonth
          ? indicator.value
          : (previous?.get(month)?.get(indicator.indicator_id) ?? null);

      if (value === null) continue;
      labels.push(formatShortMonth(month));
      data.push(value);
    }

    series[indicator.indicator_id] = { labels, data };
  }

  return series;
}

/*
 * Chart history for the company's own indicators. The API only returns one
 * month per request, so the 5 months before `month` are fetched in parallel
 * and merged by indicator_id with the month that is already loaded.
 *
 * It starts only after the selected month has loaded with at least one
 * indicator, so the main request always goes first. A previous month that
 * fails to load is treated as "no records" instead of breaking the page.
 * Until the history arrives, each chart shows just the current month.
 */
export function useEsgHistory(
  companyId: string | undefined,
  month: string,
  indicators: MonthlyIndicator[] | null
): Record<string, EsgSeries> {
  const [loaded, setLoaded] = useState<{
    key: string;
    previous: PreviousValues;
  } | null>(null);

  const key = `${companyId}|${month}`;
  const hasCurrent = Boolean(indicators && indicators.length > 0);
  const isEnabled = Boolean(companyId) && isValidMonth(month) && hasCurrent;

  useEffect(() => {
    if (!companyId || !isValidMonth(month) || !hasCurrent) return;

    let isCurrent = true;
    const previousMonths = getMonthWindow(month).slice(0, -1);

    void Promise.allSettled(
      previousMonths.map((previousMonth) =>
        getEsgIndicators(companyId, previousMonth)
      )
    ).then((results) => {
      if (!isCurrent) return;

      const previous: PreviousValues = new Map();
      results.forEach((result, index) => {
        if (result.status !== 'fulfilled') return;

        const values = result.value.flatMap((indicator) =>
          indicator.value === null
            ? []
            : [[indicator.indicator_id, indicator.value] as [string, number]]
        );
        previous.set(previousMonths[index], new Map(values));
      });

      setLoaded({ key, previous });
    });

    return () => {
      isCurrent = false;
    };
  }, [companyId, hasCurrent, key, month]);

  if (!isEnabled || !indicators) return {};

  const previous = loaded?.key === key ? loaded.previous : null;
  return buildSeries(getMonthWindow(month), previous, indicators);
}

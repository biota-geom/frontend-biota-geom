export type IndicatorCategory = 'Ambiental' | 'Social' | 'Governança';

/** One indicator as returned by the GET endpoint (with monthly value). */
export interface MonthlyIndicator {
  indicator_id: string;
  name: string;
  unit: string;
  category: IndicatorCategory;
  value: number | null;
}

/**
 * Body of the PUT. A number saves/updates the indicator record, null clears
 * one that was saved before. Indicators absent from the list stay untouched.
 */
export interface EsgIndicatorRecord {
  indicator_id: string;
  value: number | null;
}

export interface EsgIndicatorsPayload {
  records: EsgIndicatorRecord[];
}

/** One KPI card: the month, the month before and the change in percent. */
export interface IndicatorSummary {
  indicator_id: string;
  name: string;
  unit: string;
  category: IndicatorCategory;
  current: number | null;
  previous: number | null;
  /** Null without a previous value, or when the previous value is zero. */
  variation_pct: number | null;
}

export interface EsgIndicatorsSummary {
  /** "YYYY-MM"; null when the company has no record yet. */
  reference_month: string | null;
  indicators: IndicatorSummary[];
}

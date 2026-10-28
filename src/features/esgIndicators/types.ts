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

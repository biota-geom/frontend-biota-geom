export const ESG_INDICATOR_KEYS = [
  'water',
  'waste',
  'employees',
  'energy',
] as const;

export type EsgIndicatorKey = (typeof ESG_INDICATOR_KEYS)[number];

/** Saved values of one month; null means the indicator was never informed. */
export type EsgMonthlyIndicators = Record<EsgIndicatorKey, number | null>;

/**
 * Body of the PUT. A number saves the indicator, null clears one that was
 * saved before, and a missing key leaves it untouched.
 */
export type EsgIndicatorsPayload = Partial<
  Record<EsgIndicatorKey, number | null>
>;

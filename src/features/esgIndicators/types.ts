export const ESG_INDICATOR_KEYS = [
  'water',
  'waste',
  'employees',
  'energy',
] as const;

export type EsgIndicatorKey = (typeof ESG_INDICATOR_KEYS)[number];

export type EsgMonthlyIndicators = Record<EsgIndicatorKey, number | null>;

export type EsgIndicatorsPayload = Partial<Record<EsgIndicatorKey, number>>;

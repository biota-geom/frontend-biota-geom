import type {
  Legislation,
  LegislationImpact,
  LegislationType,
  LicenseLegislationSource,
} from './types';

const TYPE_LABELS: Record<LegislationType, string> = {
  LEI: 'Lei',
  DECRETO: 'Decreto',
  RESOLUCAO: 'Resolução',
  PORTARIA: 'Portaria',
  INSTRUCAO_NORMATIVA: 'Instrução Normativa',
  OUTRO: 'Outro',
};

const SOURCE_LABELS: Record<LicenseLegislationSource, string> = {
  SCAN: 'Extraída do scan',
  MANUAL: 'Manual',
};

/** Most critical first, the order the filter and the selector list them in. */
export const LEGISLATION_IMPACTS: readonly LegislationImpact[] = [
  'HIGH',
  'MODERATE',
  'LOW',
];

const IMPACT_LABELS: Record<LegislationImpact, string> = {
  HIGH: 'Impacta sua operação',
  MODERATE: 'Impacto moderado',
  LOW: 'Baixo impacto',
};

export const UNCLASSIFIED_IMPACT_LABEL = 'Sem classificação';

export function formatLegislationImpact(
  impact: LegislationImpact | null
): string {
  return impact === null ? UNCLASSIFIED_IMPACT_LABEL : IMPACT_LABELS[impact];
}

/** Narrows a form value (`''` for none) back to an impact level, or null. */
export function parseLegislationImpact(
  value: string
): LegislationImpact | null {
  return LEGISLATION_IMPACTS.find((impact) => impact === value) ?? null;
}

export function formatLegislationType(type: LegislationType): string {
  return TYPE_LABELS[type];
}

export function formatLegislationSource(
  source: LicenseLegislationSource
): string {
  return SOURCE_LABELS[source];
}

/** "nº 12.305/2010" — the act's number and year as cited in documents. */
export function formatLegislationNumber({
  number,
  year,
}: Pick<Legislation, 'number' | 'year'>): string {
  return `nº ${number}/${year}`;
}

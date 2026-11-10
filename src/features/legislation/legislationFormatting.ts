import type {
  Legislation,
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

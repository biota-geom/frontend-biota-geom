const STATUS_LABELS: Record<string, string> = {
  FULFILLED: 'Atendida',
  IN_PROGRESS: 'Em andamento',
  OVERDUE: 'Atrasada',
  REGULAR: 'Regular',
  ATTENTION: 'Atenção',
  EXPIRED: 'Vencida',
};

const CONDITION_TYPE_LABELS: Record<string, string> = {
  INFORMATIVE: 'Informativo',
  PERIODIC: 'Periódico',
};

const PERIODICITY_LABELS: Record<string, string> = {
  MONTHLY: 'Mensal',
  QUARTERLY: 'Trimestral',
  SEMIANNUAL: 'Semestral',
  ANNUAL: 'Anual',
  NA: 'Não se aplica',
};

function translateEnum(
  value: string | null | undefined,
  labels: Record<string, string>
): string {
  if (!value) return '—';
  return labels[value] ?? value;
}

export function formatLicenseStatus(status: string): string {
  return translateEnum(status, STATUS_LABELS);
}

export function formatConditionStatus(status: string): string {
  return translateEnum(status, STATUS_LABELS);
}

export function formatConditionType(conditionType: string | null): string {
  return translateEnum(conditionType, CONDITION_TYPE_LABELS);
}

export function formatConditionPeriodicity(periodicity: string | null): string {
  return translateEnum(periodicity, PERIODICITY_LABELS);
}

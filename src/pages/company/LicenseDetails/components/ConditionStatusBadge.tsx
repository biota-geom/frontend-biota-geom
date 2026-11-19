import {
  formatConditionStatus,
  isConditionFulfilled,
} from '../../../../features/licenses/licenseDetailsFormatting';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

function statusStyle(status: string): string {
  if (isConditionFulfilled(status)) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (status === 'Atrasada' || status === 'OVERDUE') {
    return 'bg-rose-100 text-rose-800';
  }
  return 'bg-amber-100 text-amber-800';
}

function formatCompletion(completionDate: string): string {
  const date = new Date(completionDate);

  return Number.isNaN(date.getTime())
    ? ''
    : ` em ${DATE_FORMATTER.format(date)}`;
}

export function ConditionStatusBadge({
  status,
  completionDate = null,
}: {
  status: string;
  completionDate?: string | null;
}) {
  const isFulfilled = isConditionFulfilled(status);
  // "Cumprida em 14/11/2026" tells the operator when it was met without
  // making them read the date column next to it.
  const label =
    isFulfilled && completionDate
      ? `${formatConditionStatus(status)}${formatCompletion(completionDate)}`
      : formatConditionStatus(status);

  return (
    <span
      className={`rounded-control px-2 py-1 text-[11px] font-bold ${statusStyle(status)}`}
    >
      {label}
    </span>
  );
}

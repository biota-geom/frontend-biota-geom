import { formatConditionStatus } from '../../../../features/licenses/licenseDetailsFormatting';

function statusStyle(status: string): string {
  if (status === 'Atendida' || status === 'FULFILLED') {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (status === 'Atrasada' || status === 'OVERDUE') {
    return 'bg-rose-100 text-rose-800';
  }
  return 'bg-amber-100 text-amber-800';
}

export function ConditionStatusBadge({ status }: { status: string }) {
  const label = formatConditionStatus(status);

  return (
    <span
      className={`rounded-control px-2 py-1 text-[11px] font-bold ${statusStyle(status)}`}
    >
      {label}
    </span>
  );
}

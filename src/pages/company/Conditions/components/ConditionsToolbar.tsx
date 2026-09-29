import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import type { LicenseConditionStatusFilter } from '../../../../features/licenseConditions/types';

const STATUS_OPTIONS: Array<{
  label: string;
  value: LicenseConditionStatusFilter;
}> = [
  { label: 'Todos', value: 'all' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Atenção', value: 'ATTENTION' },
  { label: 'Risco', value: 'RISK' },
];

function isLicenseConditionStatusFilter(
  value: string
): value is LicenseConditionStatusFilter {
  return STATUS_OPTIONS.some((option) => option.value === value);
}

interface ConditionsToolbarProps {
  disabled?: boolean;
  onStatusChange: (status: LicenseConditionStatusFilter) => void;
  status: LicenseConditionStatusFilter;
  total: number;
}

export function ConditionsToolbar({
  disabled = false,
  onStatusChange,
  status,
  total,
}: ConditionsToolbarProps) {
  return (
    <div className="rounded-panel mb-6 flex items-center justify-between gap-4 border border-border bg-surface p-4 max-[640px]:flex-col max-[640px]:items-stretch">
      <Select
        disabled={disabled}
        onValueChange={(value) => {
          if (isLicenseConditionStatusFilter(value)) onStatusChange(value);
        }}
        value={status}
      >
        <SelectTrigger aria-label="Filtrar status">
          <span className="text-text-secondary">Filtrar status:</span>
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <p className="m-0 text-sm font-semibold text-text-secondary">
        {total} condicionantes registradas
      </p>
    </div>
  );
}

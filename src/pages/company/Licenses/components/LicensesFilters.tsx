import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { InputGroup } from '@/components/ui/shadcn/input-group';
import { ChevronDownIcon, SearchIcon } from '../../../../components/ui/icons';
import {
  ALL_AGENCIES_VALUE,
  type LicenseFilterValues,
} from '../../../../features/licenses/licenseFilters';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { cn } from '../../../../utils/cn';

const FILTER_BAR_CLASS =
  'rounded-panel mb-6 grid grid-cols-[minmax(0,1fr)_auto] gap-4 border border-border bg-surface p-4 max-[640px]:grid-cols-1';
const DROPDOWN_CLASS = 'relative max-[640px]:w-full';
const MENU_CLASS =
  'absolute top-full right-0 z-50 mt-1.5 max-h-60 min-w-[180px] overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg max-[640px]:right-auto max-[640px]:left-0';
const OPTION_CLASS =
  'flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm whitespace-nowrap text-text-secondary transition-colors hover:bg-surface-muted focus:bg-surface-muted focus:outline-none';
const SELECTED_OPTION_CLASS =
  'bg-surface-muted font-semibold text-primary-strong';

interface AgencyDropdownProps {
  agencyOptions: string[];
  onChange: (agency: string) => void;
  value: string;
}

/** Mirrors admin/Companies' FilterDropdown; kept local since it is only used here. */
function AgencyDropdown({
  agencyOptions,
  onChange,
  value,
}: AgencyDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const options = [
    { label: 'Todos', value: ALL_AGENCIES_VALUE },
    ...agencyOptions.map((agency) => ({ label: agency, value: agency })),
  ];
  const selectedLabel =
    options.find((option) => option.value === value)?.label ?? 'Todos';

  return (
    <div className={DROPDOWN_CLASS} ref={ref}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((previous) => !previous)}
        type="button"
        variant="filter"
      >
        {`Órgão: ${selectedLabel}`}
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </Button>

      {isOpen ? (
        <div aria-label="Órgão" className={MENU_CLASS} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={cn(
                OPTION_CLASS,
                option.value === value && SELECTED_OPTION_CLASS
              )}
              key={option.value || 'all'}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface LicensesFiltersProps {
  agencyOptions: string[];
  onChange: (filters: LicenseFilterValues) => void;
  values: LicenseFilterValues;
}

/**
 * Search + issuing-agency filter bar for the licenses panel. Fully
 * controlled and applied on every keystroke — the panel is already loaded in
 * memory, so there is nothing to debounce.
 */
export function LicensesFilters({
  agencyOptions,
  onChange,
  values,
}: LicensesFiltersProps) {
  return (
    <div className={FILTER_BAR_CLASS}>
      <InputGroup as="label" variant="search">
        <SearchIcon />
        <span className="sr-only">Buscar licença</span>
        <Input
          onChange={(event) =>
            onChange({ ...values, search: event.target.value })
          }
          placeholder="Buscar licença por tipo, nº do processo ou órgão emissor..."
          type="search"
          value={values.search}
        />
      </InputGroup>

      <AgencyDropdown
        agencyOptions={agencyOptions}
        onChange={(agency) => onChange({ ...values, agency })}
        value={values.agency}
      />
    </div>
  );
}

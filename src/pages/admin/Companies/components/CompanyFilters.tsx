import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Input } from '@/components/ui/shadcn/input';
import { InputGroup } from '@/components/ui/shadcn/input-group';
import { ChevronDownIcon, SearchIcon } from '../../../../components/ui/icons';
import {
  ALL_FILTER_VALUE,
  type CompanyFilterValues,
  type CompanyStatusFilter,
} from '../../../../features/companies/companyFilters';
import { useClickOutside } from '../../../../hooks/useClickOutside';
import { cn } from '../../../../utils/cn';

/*
 * Class strings of the elements this file owns. They are styling only — no
 * test should assert on them — so they live here with the mutation directives
 * the README describes, instead of inline in the markup.
 */
const FILTER_BAR_CLASS =
  // Stryker disable next-line all: styling-only class string (see README)
  'rounded-panel mb-8 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-4 border border-border bg-surface p-4 max-[820px]:grid-cols-1';
// Stryker disable next-line all: styling-only class string (see README)
const DROPDOWN_CLASS = 'relative max-[820px]:w-full';
// Stryker disable next-line all: styling-only class string (see README)
const CHEVRON_CLASS = 'transition-transform duration-200';
// Stryker disable next-line all: styling-only class string (see README)
const CHEVRON_OPEN_CLASS = 'rotate-180';
const MENU_CLASS =
  // Stryker disable next-line all: styling-only class string (see README)
  'absolute top-full left-0 z-50 mt-1.5 max-h-60 min-w-full overflow-y-auto rounded-lg border border-border bg-surface p-1.5 shadow-lg';
const OPTION_CLASS =
  // Stryker disable next-line all: styling-only class string (see README)
  'flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm whitespace-nowrap text-text-secondary transition-colors hover:bg-surface-muted focus:bg-surface-muted focus:outline-none';
const SELECTED_OPTION_CLASS =
  // Stryker disable next-line all: styling-only class string (see README)
  'bg-surface-muted font-semibold text-primary-strong';

interface FilterOption<TValue extends string> {
  label: string;
  value: TValue;
}

const STATUS_OPTIONS: FilterOption<CompanyStatusFilter>[] = [
  { label: 'Todos', value: ALL_FILTER_VALUE },
  { label: 'Ativos', value: 'active' },
  { label: 'Inativos', value: 'inactive' },
];

interface FilterDropdownProps<TValue extends string> {
  label: string;
  onChange: (value: TValue) => void;
  options: FilterOption<TValue>[];
  value: TValue;
}

/**
 * Filter trigger plus its menu. Mirrors the header's `CompanyDropdown`: the
 * trigger keeps the `filter` button styling, and the menu closes on Escape or
 * on a click outside.
 */
function FilterDropdown<TValue extends string>({
  label,
  onChange,
  options,
  value,
}: FilterDropdownProps<TValue>) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setIsOpen(false));

  useEffect(() => {
    /* A closed menu has nothing to react to, so keeping the listener
     * registered is unobservable (see README). */
    // Stryker disable next-line all
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    /* A leaked listener is not observable from the rendered output —
     * untested on purpose (see README). */
    // Stryker disable next-line all
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const selected =
    options.find((option) => option.value === value) ?? options[0];

  return (
    <div className={DROPDOWN_CLASS} ref={ref}>
      <Button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        onClick={() => setIsOpen((previous) => !previous)}
        type="button"
        variant="filter"
      >
        {`${label}: ${selected.label}`}
        <ChevronDownIcon
          className={cn(
            CHEVRON_CLASS,
            // Stryker disable next-line all: chevron rotation is styling-only (see README)
            isOpen && CHEVRON_OPEN_CLASS
          )}
        />
      </Button>

      {isOpen ? (
        <div aria-label={label} className={MENU_CLASS} role="listbox">
          {options.map((option) => (
            <button
              aria-selected={option.value === value}
              className={cn(
                OPTION_CLASS,
                // Stryker disable next-line all: selected styling only (see README)
                option.value === value && SELECTED_OPTION_CLASS
              )}
              key={option.value}
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

interface CompanyFiltersProps {
  onChange: (filters: CompanyFilterValues) => void;
  /** Segment names present in the loaded listing, already sorted. */
  segmentOptions: string[];
  values: CompanyFilterValues;
}

/**
 * Filter bar of the company listing. Fully controlled: the page owns the
 * values so it can derive the filtered listing (and reset them from its empty
 * state). Filtering is applied on every keystroke — the list is already in
 * memory, so there is nothing to debounce.
 */
export function CompanyFilters({
  onChange,
  segmentOptions,
  values,
}: CompanyFiltersProps) {
  const segmentFilterOptions: FilterOption<string>[] = [
    { label: 'Todos', value: ALL_FILTER_VALUE },
    ...segmentOptions.map((segment) => ({ label: segment, value: segment })),
  ];

  return (
    <div className={FILTER_BAR_CLASS}>
      <InputGroup as="label" variant="search">
        <SearchIcon />
        <span className="sr-only">Buscar empresas</span>
        <Input
          onChange={(event) =>
            onChange({ ...values, search: event.target.value })
          }
          placeholder="Buscar por nome da filial, estado ou segmento..."
          type="search"
          value={values.search}
        />
      </InputGroup>

      <FilterDropdown
        label="Segmento"
        onChange={(segment) => onChange({ ...values, segment })}
        options={segmentFilterOptions}
        value={values.segment}
      />
      <FilterDropdown
        label="Status"
        onChange={(status) => onChange({ ...values, status })}
        options={STATUS_OPTIONS}
        value={values.status}
      />
    </div>
  );
}

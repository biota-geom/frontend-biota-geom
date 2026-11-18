import {
  LEGISLATION_IMPACTS,
  UNCLASSIFIED_IMPACT_LABEL,
  formatLegislationImpact,
  parseLegislationImpact,
} from '../../../../features/legislation/legislationFormatting';
import type { LegislationImpact } from '../../../../features/legislation/types';

interface LegislationImpactSelectProps {
  /** Names the control for assistive tech, e.g. "Lei nº 12.305/2010". */
  legislationName: string;
  impact: LegislationImpact | null;
  disabled?: boolean;
  onChange: (impact: LegislationImpact | null) => void;
}

/** Edits an entry's impact; "Sem classificação" clears it. */
export function LegislationImpactSelect({
  disabled = false,
  impact,
  legislationName,
  onChange,
}: LegislationImpactSelectProps) {
  return (
    <label className="flex items-center gap-2 text-[11px] font-semibold text-text-secondary">
      <span aria-hidden="true">Impacto</span>
      <select
        aria-label={`Impacto de ${legislationName}`}
        className="rounded-control min-h-[30px] border border-border bg-surface px-2 text-xs text-text-primary outline-0 focus:border-focus disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled}
        onChange={(event) =>
          onChange(parseLegislationImpact(event.target.value))
        }
        value={impact ?? ''}
      >
        <option value="">{UNCLASSIFIED_IMPACT_LABEL}</option>
        {LEGISLATION_IMPACTS.map((level) => (
          <option key={level} value={level}>
            {formatLegislationImpact(level)}
          </option>
        ))}
      </select>
    </label>
  );
}

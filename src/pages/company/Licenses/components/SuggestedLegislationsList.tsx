import {
  formatLegislationNumber,
  formatLegislationType,
} from '../../../../features/legislation/legislationFormatting';
import { legislationIdentityKey } from '../../../../features/legislation/legislationIdentity';
import type { LegislationImpact } from '../../../../features/legislation/types';
import type { SuggestedLegislation } from '../../../../features/licenses/types';
import { LegislationImpactSelect } from '../../LicenseDetails/components/LegislationImpactSelect';

interface SuggestedLegislationsListProps {
  /** The laws the scan found, with the impact as currently edited. */
  suggestions: SuggestedLegislation[];
  /** Whether a suggestion is currently kept (will be linked on save). */
  isSelected: (suggestion: SuggestedLegislation) => boolean;
  onToggle: (suggestion: SuggestedLegislation, selected: boolean) => void;
  onImpactChange: (
    suggestion: SuggestedLegislation,
    impact: LegislationImpact | null
  ) => void;
  disabled?: boolean;
}

/*
 * "Legislações encontradas": the laws the AI found in the document, for the
 * user to review. A checked law goes to the "Legislações" section and is linked
 * when the license is saved; an unchecked one is not. The impact is only the
 * AI's suggestion and stays editable.
 */
export function SuggestedLegislationsList({
  disabled = false,
  isSelected,
  onImpactChange,
  onToggle,
  suggestions,
}: SuggestedLegislationsListProps) {
  if (suggestions.length === 0) return null;

  return (
    <section
      aria-label="Legislações encontradas"
      className="col-span-2 flex flex-col gap-3 rounded-panel border border-border p-4 max-[560px]:col-span-1"
    >
      <div>
        <h3 className="m-0 text-sm font-bold text-text-primary">
          Legislações encontradas
        </h3>
        <p className="m-0 mt-1 text-xs text-text-secondary">
          Sugeridas pela IA a partir do documento. Marque as que devem ser
          vinculadas à licença.
        </p>
      </div>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {suggestions.map((suggestion) => {
          const { legislation } = suggestion;
          const title = `${formatLegislationType(legislation.type)} ${formatLegislationNumber(legislation)}`;

          return (
            <li
              className="flex flex-col gap-2 rounded-control bg-surface-muted px-3 py-3 text-xs"
              key={legislationIdentityKey(legislation)}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex min-w-0 cursor-pointer items-center gap-2">
                  <input
                    aria-label={`Vincular ${title}`}
                    checked={isSelected(suggestion)}
                    className="size-4 accent-primary"
                    disabled={disabled}
                    onChange={(event) =>
                      onToggle(suggestion, event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span className="font-bold text-text-primary">{title}</span>
                  <span className="text-text-secondary">
                    {legislation.issuingBody}
                  </span>
                </label>
                <LegislationImpactSelect
                  disabled={disabled}
                  impact={suggestion.impact}
                  legislationName={title}
                  onChange={(impact) => onImpactChange(suggestion, impact)}
                />
              </div>
              {legislation.summary ? (
                <p className="m-0 text-text-secondary">{legislation.summary}</p>
              ) : null}
              {suggestion.citedExcerpt ? (
                <blockquote className="m-0 border-l-2 border-border pl-3 text-text-secondary italic">
                  {suggestion.citedExcerpt}
                </blockquote>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

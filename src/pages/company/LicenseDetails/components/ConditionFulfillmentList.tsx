import { useState } from 'react';
import type {
  ConditionFulfillmentRow,
  LicenseConditionDetail,
} from '../../../../features/licenses/types';

interface Props {
  conditions: LicenseConditionDetail[];
  /**
   * Called whenever any selection changes.
   * `isComplete` is true when every row has been answered.
   * The parent uses this to enable/disable the "Save" button.
   */
  onChange: (rows: ConditionFulfillmentRow[], isComplete: boolean) => void;
}

function toggleButtonClass(selected: boolean): string {
  return [
    'rounded-control px-3 py-1 text-xs font-semibold transition-colors',
    selected
      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400'
      : 'bg-surface-muted text-text-secondary hover:bg-surface-raised',
  ].join(' ');
}

function notFulfilledButtonClass(selected: boolean): string {
  return [
    'rounded-control px-3 py-1 text-xs font-semibold transition-colors',
    selected
      ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-400'
      : 'bg-surface-muted text-text-secondary hover:bg-surface-raised',
  ].join(' ');
}

export function ConditionFulfillmentList({ conditions, onChange }: Props) {
  const [selections, setSelections] = useState<
    Record<string, boolean | undefined>
  >(() => Object.fromEntries(conditions.map((c) => [c.id, undefined])));

  function handleSelect(conditionId: string, fulfilled: boolean) {
    const next = { ...selections, [conditionId]: fulfilled };
    setSelections(next);

    const rows: ConditionFulfillmentRow[] = conditions.map((c) => ({
      conditionId: c.id,
      itemNumber: c.itemNumber,
      description: c.description,
      conditionType: c.conditionType,
      fulfilled: next[c.id],
    }));

    const isComplete = rows.every((r) => r.fulfilled !== undefined);
    onChange(rows, isComplete);
  }

  if (conditions.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-secondary">
        Nenhuma condicionante cadastrada para esta licença.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border" role="list">
      {conditions.map((condition) => {
        const selected = selections[condition.id];
        const itemLabel = condition.itemNumber ?? '—';

        return (
          <div
            className="flex items-start justify-between gap-4 px-4 py-3 max-[560px]:flex-col"
            key={condition.id}
            role="listitem"
          >
            {/* Condition info */}
            <div className="min-w-0 flex-1">
              <span className="mr-2 font-mono text-[11px] font-bold text-text-muted">
                {itemLabel}
              </span>
              <span className="text-xs text-text-primary">
                {condition.description ?? '—'}
              </span>
              {condition.conditionType ? (
                <span className="ml-2 text-[11px] text-text-muted">
                  ({condition.conditionType})
                </span>
              ) : null}
            </div>

            {/* Toggle buttons */}
            <div
              aria-label={`Cumprimento da condicionante ${itemLabel}`}
              className="flex shrink-0 gap-2"
              role="group"
            >
              <button
                aria-pressed={selected === true}
                className={toggleButtonClass(selected === true)}
                onClick={() => handleSelect(condition.id, true)}
                type="button"
              >
                Cumprida
              </button>
              <button
                aria-pressed={selected === false}
                className={notFulfilledButtonClass(selected === false)}
                onClick={() => handleSelect(condition.id, false)}
                type="button"
              >
                Não cumprida
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

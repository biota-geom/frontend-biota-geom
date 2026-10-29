import type { ReactNode } from 'react';
import {
  getActionableConditions,
  type ActionableCondition,
} from '../../../../features/licenses/actionableConditions';
import type { LicenseConditionDetail } from '../../../../features/licenses/types';

interface Props {
  conditions: LicenseConditionDetail[];
  /**
   * Answer per condition id; a missing entry is not answered yet. Owned by
   * the parent, so a reloaded `conditions` list keeps the answers that still
   * apply and shows new conditions unanswered.
   */
  selections: Partial<Record<string, boolean>>;
  onSelect: (conditionId: string, fulfilled: boolean) => void;
  /** Extra controls rendered under a row, e.g. the renewal's copy option. */
  renderRowAddon?: (condition: ActionableCondition) => ReactNode;
}

function toggleButtonClass(selected: boolean): string {
  return [
    'rounded-control px-3 py-1 text-xs font-semibold transition-colors',
    selected
      ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-400'
      : 'bg-surface-muted text-text-secondary hover:bg-surface-soft',
  ].join(' ');
}

function notFulfilledButtonClass(selected: boolean): string {
  return [
    'rounded-control px-3 py-1 text-xs font-semibold transition-colors',
    selected
      ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-400'
      : 'bg-surface-muted text-text-secondary hover:bg-surface-soft',
  ].join(' ');
}

export function ConditionFulfillmentList({
  conditions,
  selections,
  onSelect,
  renderRowAddon,
}: Props) {
  const actionableConditions = getActionableConditions(conditions);

  if (actionableConditions.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-secondary">
        Nenhuma condicionante cadastrada para esta licença.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border" role="list">
      {actionableConditions.map((condition) => {
        const selected = selections[condition.id];
        const itemLabel = condition.itemNumber ?? '—';
        const addon = renderRowAddon?.(condition);

        return (
          <div className="px-4 py-3" key={condition.id} role="listitem">
            <div className="flex items-start justify-between gap-4 max-[560px]:flex-col">
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
                  onClick={() => onSelect(condition.id, true)}
                  type="button"
                >
                  Cumprida
                </button>
                <button
                  aria-pressed={selected === false}
                  className={notFulfilledButtonClass(selected === false)}
                  onClick={() => onSelect(condition.id, false)}
                  type="button"
                >
                  Não cumprida
                </button>
              </div>
            </div>

            {addon ? <div className="mt-2">{addon}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

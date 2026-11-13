import { formatLegislationImpact } from '../../../../features/legislation/legislationFormatting';
import type { LegislationImpact } from '../../../../features/legislation/types';

const IMPACT_BADGE_CLASSES: Record<LegislationImpact | 'NONE', string> = {
  HIGH: 'bg-rose-100 text-rose-800',
  MODERATE: 'bg-amber-100 text-amber-800',
  LOW: 'bg-emerald-100 text-emerald-800',
  NONE: 'bg-surface-muted text-text-secondary',
};

/** How much a legislation affects the license; `null` = not classified yet. */
export function LegislationImpactBadge({
  impact,
}: {
  impact: LegislationImpact | null;
}) {
  return (
    <span
      className={`rounded-control px-2 py-1 text-[11px] font-bold ${IMPACT_BADGE_CLASSES[impact ?? 'NONE']}`}
    >
      {formatLegislationImpact(impact)}
    </span>
  );
}

import { Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  formatLegislationNumber,
  formatLegislationSource,
  formatLegislationType,
} from '../../../../features/legislation/legislationFormatting';
import type { LicenseLegislation } from '../../../../features/legislation/types';

type RadarSlot = (item: LicenseLegislation) => ReactNode;

interface LegislationRadarProps {
  legislations: LicenseLegislation[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  onRetry: () => void;
  /** Opens the add-legislation modal (task #117). Until it exists, the button does nothing. */
  onAddLegislation?: () => void;
  /** Slot next to the item's badges, e.g. the impact tag. */
  renderTags?: RadarSlot;
  /** Slot at the bottom of the item, e.g. the technical analysis actions. */
  renderActions?: RadarSlot;
}

const SOURCE_BADGE_CLASSES: Record<LicenseLegislation['source'], string> = {
  SCAN: 'bg-blue-100 text-blue-800',
  MANUAL: 'bg-surface-muted text-text-secondary',
};

function LoadingRadar() {
  return (
    <div
      aria-label="Carregando radar de legislação"
      className="animate-pulse space-y-3 p-4"
      role="status"
    >
      {Array.from({ length: 2 }, (_, index) => (
        <div className="h-20 rounded-panel bg-surface-muted" key={index} />
      ))}
    </div>
  );
}

function RadarItem({
  item,
  renderActions,
  renderTags,
}: {
  item: LicenseLegislation;
  renderActions?: RadarSlot;
  renderTags?: RadarSlot;
}) {
  const { legislation } = item;
  const tags = renderTags?.(item);
  const actions = renderActions?.(item);

  return (
    <li className="flex flex-col gap-2 px-4 py-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-sm font-bold text-text-primary">
          {formatLegislationType(legislation.type)}{' '}
          {formatLegislationNumber(legislation)}
        </h3>
        <span
          className={`rounded-control px-2 py-1 text-[11px] font-bold ${SOURCE_BADGE_CLASSES[item.source]}`}
        >
          {formatLegislationSource(item.source)}
        </span>
        {tags ? (
          <div className="flex flex-wrap items-center gap-2" data-slot="tags">
            {tags}
          </div>
        ) : null}
      </div>
      <p className="m-0 font-semibold text-text-secondary">
        {legislation.issuingBody}
      </p>
      <p className="m-0 text-text-secondary">
        {legislation.summary ?? 'Ementa não informada.'}
      </p>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2" data-slot="actions">
          {actions}
        </div>
      ) : null}
    </li>
  );
}

/*
 * The license's legislation radar. Impact (#121) and technical analysis
 * (#122) plug into each item through `renderTags` and `renderActions`
 * instead of changing this component.
 */
export function LegislationRadar({
  error,
  legislations,
  onAddLegislation,
  onRetry,
  renderActions,
  renderTags,
  status,
}: LegislationRadarProps) {
  return (
    <section
      aria-label="Radar de Legislação"
      className="mt-5 overflow-hidden rounded-panel border border-border bg-surface"
    >
      <h2 className="m-0 border-b border-border p-3 text-sm font-bold text-text-primary">
        Radar de Legislação
      </h2>

      {status === 'loading' || status === 'idle' ? <LoadingRadar /> : null}

      {status === 'error' ? (
        <div className="p-4 text-sm text-rose-800" role="alert">
          <p className="m-0 font-semibold">{error}</p>
          <button
            className="mt-2 font-bold underline"
            onClick={onRetry}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      ) : null}

      {status === 'success' && legislations.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="m-0 text-sm text-text-secondary">
            Nenhuma legislação vinculada
          </p>
          <Button onClick={onAddLegislation} type="button" variant="addRow">
            <Plus aria-hidden="true" size={15} />
            Adicionar legislação
          </Button>
        </div>
      ) : null}

      {status === 'success' && legislations.length > 0 ? (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {legislations.map((item) => (
            <RadarItem
              item={item}
              key={item.id}
              renderActions={renderActions}
              renderTags={renderTags}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

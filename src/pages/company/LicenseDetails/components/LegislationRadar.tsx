import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import {
  LEGISLATION_IMPACTS,
  formatLegislationImpact,
  formatLegislationNumber,
  formatLegislationSource,
  formatLegislationType,
  parseLegislationImpact,
} from '../../../../features/legislation/legislationFormatting';
import type {
  LegislationImpact,
  LicenseLegislation,
} from '../../../../features/legislation/types';

type RadarSlot = (item: LicenseLegislation) => ReactNode;

interface LegislationRadarProps {
  legislations: LicenseLegislation[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error: string | null;
  onRetry: () => void;
  /** Opens the add-legislation modal; without it the add buttons are hidden. */
  onAddLegislation?: () => void;
  /** Opens the edit modal for an entry; without it the item has no edit button. */
  onEditLegislation?: (item: LicenseLegislation) => void;
  /** Asks to remove an entry; without it the item has no remove button. */
  onRemoveLegislation?: (item: LicenseLegislation) => void;
  /** Slot next to the item's badges, e.g. the impact tag. */
  renderTags?: RadarSlot;
  /** Slot at the bottom of the item, e.g. the technical analysis actions. */
  renderActions?: RadarSlot;
  /** Active impact filter; null/undefined = every entry. Needs `onImpactFilterChange`. */
  impactFilter?: LegislationImpact | null;
  /** Shows the impact filter in the section header when provided. */
  onImpactFilterChange?: (impact: LegislationImpact | null) => void;
  /** Called when an unread item is opened, so the page can mark it as read. */
  onItemOpen?: (item: LicenseLegislation) => void;
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

function AddLegislationButton({ onClick }: { onClick: () => void }) {
  return (
    <Button onClick={onClick} type="button" variant="addRow">
      <Plus aria-hidden="true" size={15} />
      Adicionar legislação
    </Button>
  );
}

function RadarItem({
  item,
  onEdit,
  onOpen,
  onRemove,
  renderActions,
  renderTags,
}: {
  item: LicenseLegislation;
  onEdit?: (item: LicenseLegislation) => void;
  onOpen?: (item: LicenseLegislation) => void;
  onRemove?: (item: LicenseLegislation) => void;
  renderActions?: RadarSlot;
  renderTags?: RadarSlot;
}) {
  const { legislation } = item;
  const [isOpen, setIsOpen] = useState(false);
  const detailsId = useId();
  const tags = renderTags?.(item);
  const actions = renderActions?.(item);
  const title = `${formatLegislationType(legislation.type)} ${formatLegislationNumber(legislation)}`;

  function toggle() {
    setIsOpen(!isOpen);
    if (!isOpen && item.readAt === null) onOpen?.(item);
  }

  return (
    <li className="flex flex-col gap-2 px-4 py-4 text-xs">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="m-0 text-sm font-bold text-text-primary">{title}</h3>
        {item.readAt === null ? (
          <span className="rounded-control bg-blue-600 px-2 py-1 text-[11px] font-bold text-white">
            Novo
          </span>
        ) : null}
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
        {onEdit || onRemove ? (
          <div className="ml-auto flex items-center gap-2">
            {onEdit ? (
              <Button
                aria-label={`Editar ${title}`}
                onClick={() => onEdit(item)}
                title="Editar legislação"
                type="button"
                variant="iconSoft"
              >
                <Pencil aria-hidden="true" size={14} />
              </Button>
            ) : null}
            {onRemove ? (
              <Button
                aria-label={`Remover ${title}`}
                onClick={() => onRemove(item)}
                title="Remover legislação"
                type="button"
                variant="iconDanger"
              >
                <Trash2 aria-hidden="true" size={14} />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
      {legislation.issuingBody ? (
        <p className="m-0 font-semibold text-text-secondary">
          {legislation.issuingBody}
        </p>
      ) : null}
      <p className="m-0 text-text-secondary">
        {legislation.summary ?? 'Ementa não informada.'}
      </p>
      {isOpen ? (
        <div
          className="rounded-control bg-surface-muted p-3 text-text-secondary"
          id={detailsId}
        >
          <p className="m-0 mb-1 font-bold text-text-primary">
            Trecho citado na licença
          </p>
          <p className="m-0">
            {item.citedExcerpt ?? 'Nenhum trecho citado para esta legislação.'}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          aria-controls={isOpen ? detailsId : undefined}
          aria-expanded={isOpen}
          className="inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-bold text-link"
          onClick={toggle}
          type="button"
        >
          {isOpen ? 'Ocultar detalhes' : 'Ver detalhes'}
          <ChevronDown
            aria-hidden="true"
            className={isOpen ? 'rotate-180' : undefined}
            size={14}
          />
        </button>
        {actions ? (
          <div
            className="flex flex-wrap items-center gap-2"
            data-slot="actions"
          >
            {actions}
          </div>
        ) : null}
      </div>
    </li>
  );
}

/*
 * The license's legislation radar. The impact badge/selector (#121) and the
 * technical analysis (#122) plug into each item through `renderTags` and
 * `renderActions`. Opening an item shows its cited excerpt and reports an
 * unread one through `onItemOpen`; the "Novo" tag follows `readAt`.
 */
export function LegislationRadar({
  error,
  impactFilter = null,
  legislations,
  onAddLegislation,
  onEditLegislation,
  onImpactFilterChange,
  onItemOpen,
  onRemoveLegislation,
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
      <div className="flex items-center justify-between gap-4 border-b border-border p-3 max-[640px]:flex-col max-[640px]:items-stretch">
        <h2 className="m-0 text-sm font-bold text-text-primary">
          Radar de Legislação
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {onImpactFilterChange ? (
            <select
              aria-label="Filtrar por impacto"
              className="rounded-control min-h-[34px] border border-border bg-surface px-2 text-xs text-text-primary outline-0 focus:border-focus"
              onChange={(event) =>
                onImpactFilterChange(parseLegislationImpact(event.target.value))
              }
              value={impactFilter ?? ''}
            >
              <option value="">Todos os impactos</option>
              {LEGISLATION_IMPACTS.map((level) => (
                <option key={level} value={level}>
                  {formatLegislationImpact(level)}
                </option>
              ))}
            </select>
          ) : null}
          {onAddLegislation &&
          status === 'success' &&
          legislations.length > 0 ? (
            <AddLegislationButton onClick={onAddLegislation} />
          ) : null}
        </div>
      </div>

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

      {status === 'success' && legislations.length === 0 && impactFilter ? (
        <p className="m-0 px-4 py-8 text-center text-sm text-text-secondary">
          Nenhuma legislação com o impacto “
          {formatLegislationImpact(impactFilter)}”.
        </p>
      ) : null}

      {status === 'success' && legislations.length === 0 && !impactFilter ? (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="m-0 text-sm text-text-secondary">
            Nenhuma legislação vinculada
          </p>
          {onAddLegislation ? (
            <AddLegislationButton onClick={onAddLegislation} />
          ) : null}
        </div>
      ) : null}

      {status === 'success' && legislations.length > 0 ? (
        <ul className="m-0 list-none divide-y divide-border p-0">
          {legislations.map((item) => (
            <RadarItem
              item={item}
              key={item.id}
              onEdit={onEditLegislation}
              onOpen={onItemOpen}
              onRemove={onRemoveLegislation}
              renderActions={renderActions}
              renderTags={renderTags}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}

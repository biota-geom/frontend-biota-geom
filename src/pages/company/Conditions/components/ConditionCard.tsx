import { AlertTriangle, Check, Pencil, Trash2, X } from 'lucide-react';
import type {
  LicenseCondition,
  LicenseConditionRiskLevel,
} from '../../../../features/licenseConditions/types';

const RISK_STYLES: Record<
  LicenseConditionRiskLevel,
  {
    badge: string;
    border: string;
    icon: string;
    label: string;
    symbol: typeof Check;
  }
> = {
  REGULAR: {
    badge: 'bg-emerald-100 text-emerald-700',
    border: 'border-emerald-500',
    icon: 'border-emerald-500 text-emerald-600',
    label: 'REGULAR',
    symbol: Check,
  },
  ATTENTION: {
    badge: 'bg-amber-100 text-amber-600',
    border: 'border-amber-400',
    icon: 'border-amber-400 text-amber-500',
    label: 'ATENÇÃO',
    symbol: AlertTriangle,
  },
  RISK: {
    badge: 'bg-rose-100 text-rose-700',
    border: 'border-rose-500',
    icon: 'border-rose-500 text-rose-600',
    label: 'RISCO',
    symbol: X,
  },
};

function formatDueDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(value)
  );
}

export function ConditionCard({ condition }: { condition: LicenseCondition }) {
  const style = RISK_STYLES[condition.riskLevel];
  const StatusIcon = style.symbol;

  return (
    <article
      aria-label={condition.title}
      className={`rounded-panel flex items-center gap-4 border-2 bg-surface p-5 shadow-[0_2px_6px_rgba(0,0,0,0.04)] ${style.border} max-[720px]:items-start max-[720px]:p-4`}
    >
      <span
        aria-hidden="true"
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${style.icon}`}
      >
        <StatusIcon size={14} strokeWidth={2.5} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="m-0 text-base leading-[1.2] font-bold text-text-primary">
            {condition.title}
          </h2>
          <span
            className={`rounded-control px-2 py-0.5 text-[11px] leading-[1.2] font-extrabold ${style.badge}`}
          >
            {style.label}
          </span>
        </div>

        <p className="mt-1.5 mb-0 text-sm leading-[1.35] text-text-secondary">
          {condition.description}
        </p>

        <dl className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <dt className="text-text-muted">Categoria:</dt>
            <dd className="m-0 font-semibold text-text-secondary">
              {condition.category}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <dt className="text-text-muted">Vencimento:</dt>
            <dd className="m-0 font-semibold text-text-primary">
              {formatDueDate(condition.dueDate)}
            </dd>
          </div>
        </dl>
      </div>

      <div
        aria-label="Ações da condicionante"
        className="flex shrink-0 items-center gap-2"
      >
        <button
          aria-label={`Editar ${condition.title}`}
          className="rounded-control flex h-7 w-7 items-center justify-center bg-surface-muted text-text-secondary"
          type="button"
        >
          <Pencil size={16} strokeWidth={2} />
        </button>
        <button
          aria-label={`Excluir ${condition.title}`}
          className="rounded-control flex h-7 w-7 items-center justify-center bg-rose-100 text-rose-500"
          type="button"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </article>
  );
}

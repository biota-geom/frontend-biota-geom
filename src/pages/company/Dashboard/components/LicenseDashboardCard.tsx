import { Link } from 'react-router-dom';
import {
  Card,
  CardAction,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { buildCompanyRoutes } from '../../../../app/router/routes';
import type { LicenseDashboard } from '../../../../features/licenses/types';
import { getLicenseStatusBadgeTone } from '../../../../features/licenses/licenseStatusFormatting';
import { cn } from '../../../../utils/cn';

const LICENSE_COUNTS = [
  { key: 'regular', label: 'Regulares', tone: 'regular' },
  { key: 'attention', label: 'Atenção', tone: 'attention' },
  { key: 'expired', label: 'Vencidas', tone: 'expired' },
] as const;

type LicenseDashboardCardProps = {
  companyId: string;
  dashboard: LicenseDashboard;
};

export function LicenseDashboardCard({
  companyId,
  dashboard,
}: LicenseDashboardCardProps) {
  return (
    <Card aria-label="Licenças ambientais" variant="dashboard">
      <CardHeader variant="dashboard">
        <CardTitle variant="dashboard">Licenças Ambientais</CardTitle>
        <CardAction variant="dashboard">
          <Link
            className="inline-flex items-center gap-1 text-xs font-bold text-primary-strong no-underline hover:underline"
            to={buildCompanyRoutes.licenses(companyId)}
          >
            Ver detalhes <span aria-hidden="true">→</span>
          </Link>
        </CardAction>
      </CardHeader>

      <section
        aria-label="Contagem de licenças por situação"
        className="grid grid-cols-3 gap-3 max-[520px]:gap-2"
      >
        {LICENSE_COUNTS.map(({ key, label, tone }) => (
          <div
            className={
              tone === 'regular'
                ? 'rounded-control bg-[#d8f8ea] px-3 py-3 text-center text-primary-strong'
                : tone === 'attention'
                  ? 'rounded-control bg-amber-100 px-3 py-3 text-center text-amber-700'
                  : 'rounded-control bg-red-100 px-3 py-3 text-center text-red-600'
            }
            key={key}
          >
            <p className="m-0 text-xl leading-none font-extrabold">
              {dashboard.counts[key] ?? 0}
            </p>
            <p className="mt-1.5 mb-0 text-xs font-semibold">{label}</p>
          </div>
        ))}
      </section>

      <section aria-label="Licenças críticas">
        {dashboard.critical.length > 0 ? (
          <ul className="m-0 divide-y divide-border p-0">
            {dashboard.critical.map((license) => (
              <li
                className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                key={license.id}
              >
                <Link
                  className="text-sm font-semibold text-text-secondary no-underline hover:text-primary-strong hover:underline"
                  to={buildCompanyRoutes.licenseDetails(companyId, license.id)}
                >
                  {license.processNumber}
                </Link>
                <span
                  className={cn(
                    'rounded-control inline-flex min-h-6 items-center px-[11px] text-xs font-extrabold',
                    getLicenseStatusBadgeTone(license.status)
                  )}
                >
                  {license.status} · Validade:{' '}
                  {formatDashboardDate(license.expirationDate)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="m-0 text-sm text-text-secondary">
            Nenhuma licença crítica no momento.
          </p>
        )}
      </section>
    </Card>
  );
}

export function LicenseDashboardSkeleton() {
  return (
    <section
      aria-label="Carregando resumo de licenças"
      className="rounded-panel flex flex-col gap-5 border border-border bg-surface p-6 shadow-control"
      role="status"
    >
      <span className="h-5 w-40 animate-pulse rounded bg-surface-muted" />
      <div className="grid grid-cols-3 gap-3">
        {LICENSE_COUNTS.map(({ key }) => (
          <span
            className="h-16 animate-pulse rounded-control bg-surface-muted"
            key={key}
          />
        ))}
      </div>
      <span className="h-4 w-full animate-pulse rounded bg-surface-muted" />
      <span className="h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
    </section>
  );
}

function formatDashboardDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
}

import { Link } from 'react-router-dom';
import { buildCompanyRoutes } from '../../../../app/router/routes';
import { ArrowRightIcon, FileIcon } from '../../../../components/ui/icons';
import { getLicenseStatusBadgeTone } from '../../../../features/licenses/licenseStatusFormatting';
import type { LicensePanelItem } from '../../../../features/licenses/types';
import { cn } from '../../../../utils/cn';

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' });

function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMATTER.format(date);
}

interface LicensesTableProps {
  companyId: string;
  licenses: LicensePanelItem[];
}

const COLUMN_HEADERS = [
  'Tipo',
  'Nº Processo',
  'Órgão',
  'Emissão',
  'Validade',
  'Status',
] as const;

/** Skeleton row count rendered during the loading state. */
const SKELETON_ROW_COUNT = 5;

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-border bg-surface-muted">
        {COLUMN_HEADERS.map((col) => (
          <th
            className="px-5 py-3 text-xs font-semibold text-text-muted"
            key={col}
          >
            {col}
          </th>
        ))}
        <th className="px-5 py-3 text-xs font-semibold text-text-muted">
          Ações
        </th>
      </tr>
    </thead>
  );
}

/**
 * Skeleton rows shown while the licenses are being fetched.
 * Animates a grey shimmer across every column so the layout stays stable.
 */
export function LicensesTableSkeleton() {
  return (
    <div className="rounded-panel overflow-x-auto border border-border bg-surface shadow-control">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <TableHeader />
        <tbody>
          {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
            <tr className="border-b border-border last:border-0" key={i}>
              {Array.from({ length: COLUMN_HEADERS.length + 1 }).map(
                (__, j) => (
                  <td className="px-5 py-4" key={j}>
                    <span className="block h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LicensesTable({ companyId, licenses }: LicensesTableProps) {
  return (
    <div className="rounded-panel overflow-x-auto border border-border bg-surface shadow-control">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <TableHeader />
        <tbody>
          {licenses.map((license) => (
            <tr
              className="border-b border-border last:border-0 hover:bg-surface-muted"
              key={license.id}
            >
              <td className="px-5 py-4 font-semibold text-text-primary">
                {license.type}
              </td>
              <td className="px-5 py-4 text-text-secondary">
                {license.processNumber}
              </td>
              <td className="px-5 py-4 text-text-secondary">
                {license.issuingAgency ?? '—'}
              </td>
              <td className="px-5 py-4 text-text-secondary">
                {formatDate(license.issueDate)}
              </td>
              <td className="px-5 py-4 text-text-secondary">
                {formatDate(license.expirationDate)}
              </td>
              <td className="px-5 py-4">
                <span
                  className={cn(
                    'rounded-control inline-flex min-h-6 items-center px-[11px] text-xs font-extrabold',
                    getLicenseStatusBadgeTone(license.status)
                  )}
                >
                  {license.status}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center justify-end gap-4">
                  {license.documentUrl ? (
                    <a
                      className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm font-extrabold text-text-secondary no-underline hover:text-primary-strong hover:underline hover:underline-offset-[3px]"
                      href={license.documentUrl}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      <FileIcon />
                      Abrir PDF
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm text-text-muted">
                      <FileIcon />
                      Sem PDF
                    </span>
                  )}
                  <Link
                    className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm font-extrabold text-primary-strong no-underline hover:underline hover:underline-offset-[3px]"
                    to={buildCompanyRoutes.licenseDetails(
                      companyId,
                      license.id
                    )}
                  >
                    Ver detalhes
                    <ArrowRightIcon />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

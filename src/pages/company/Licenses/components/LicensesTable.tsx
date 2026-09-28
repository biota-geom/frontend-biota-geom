import { Link } from 'react-router-dom';
import { buildCompanyRoutes } from '../../../../app/router/routes';
import { ArrowRightIcon } from '../../../../components/ui/icons';
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

export function LicensesTable({ companyId, licenses }: LicensesTableProps) {
  return (
    <div className="rounded-panel overflow-x-auto border border-border bg-surface shadow-control">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-muted">
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              Tipo
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              Nº Processo
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              Órgão
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              Emissão
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              Validade
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              Status
            </th>
            <th className="px-5 py-3 text-xs font-semibold text-text-muted">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
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
              <td className="px-5 py-4 text-right">
                <Link
                  className="inline-flex items-center gap-[7px] whitespace-nowrap text-sm font-extrabold text-primary-strong no-underline hover:underline hover:underline-offset-[3px]"
                  to={buildCompanyRoutes.licenseDetails(companyId, license.id)}
                >
                  Ver detalhes
                  <ArrowRightIcon />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

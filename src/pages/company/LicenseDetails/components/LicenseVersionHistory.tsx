import { Link } from 'react-router-dom';
import { buildCompanyRoutes } from '../../../../app/router/routes';
import { formatLicenseStatus } from '../../../../features/licenses/licenseDetailsFormatting';
import type { LicenseVersion } from '../../../../features/licenses/types';

interface LicenseVersionHistoryProps {
  companyId: string;
  versions: LicenseVersion[];
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(
    new Date(value)
  );
}

/*
 * Read-only list of the other versions in the license's renewal chain,
 * newest first: the renewals that replaced it and the versions it replaced.
 * Renders nothing for a license that was never renewed.
 */
export function LicenseVersionHistory({
  companyId,
  versions,
}: LicenseVersionHistoryProps) {
  const otherVersions = versions.filter((version) => !version.isCurrent);

  if (otherVersions.length === 0) return null;

  return (
    <section
      aria-label="Histórico de versões"
      className="mt-5 overflow-hidden rounded-panel border border-border bg-surface"
    >
      <h2 className="m-0 border-b border-border p-3 text-sm font-bold text-text-primary">
        Histórico de versões
      </h2>
      <ul className="m-0 list-none divide-y divide-border p-0">
        {otherVersions.map((version) => (
          <li
            className="flex items-center justify-between gap-4 px-4 py-3 text-xs max-[640px]:flex-col max-[640px]:items-start"
            key={version.id}
          >
            <div className="flex flex-col gap-1">
              <Link
                className="text-sm font-bold text-primary-strong underline-offset-2 hover:underline"
                to={buildCompanyRoutes.licenseDetails(companyId, version.id)}
              >
                {version.processNumber}
              </Link>
              <span className="text-text-secondary">
                {formatDate(version.issueDate)} a{' '}
                {formatDate(version.expirationDate)}
              </span>
            </div>
            <span className="rounded-control bg-surface-muted px-2 py-1 text-[11px] font-bold text-text-secondary">
              {formatLicenseStatus(version.status)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

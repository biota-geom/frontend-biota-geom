import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { buildCompanyRoutes } from '../../../../app/router/routes';
import { useConditions } from '../../../../features/licenseConditions/useConditions';
import { useConditionsCompliance } from '../../../../features/licenseConditions/useConditionsCompliance';
import { useLicensesPanel } from '../../../../features/licenses/useLicensesPanel';
import { formatLicenseStatus } from '../../../../features/licenses/licenseDetailsFormatting';
import type { LicenseCondition } from '../../../../features/licenseConditions/types';
import { ComplianceProgressBar } from '../../Conditions/components/ComplianceProgressBar';

type ConditionsSummaryBlockProps = {
  companyId: string;
};

function getRiskOrder(condition: LicenseCondition): number {
  if (condition.riskLevel === 'RISK') return 0;
  if (condition.riskLevel === 'ATTENTION') return 1;
  return 2;
}

function formatDueDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(date);
}

function isArchivedLicense(status: string): boolean {
  return formatLicenseStatus(status) === 'Renovada/Arquivada';
}

function getBadgeTone(riskLevel: LicenseCondition['riskLevel']): string {
  if (riskLevel === 'RISK') return 'bg-rose-100 text-rose-700';
  if (riskLevel === 'ATTENTION') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function getBadgeLabel(riskLevel: LicenseCondition['riskLevel']): string {
  if (riskLevel === 'RISK') return 'Risco';
  if (riskLevel === 'ATTENTION') return 'Atenção';
  return 'Regular';
}

export function ConditionsSummaryBlock({
  companyId,
}: ConditionsSummaryBlockProps) {
  const {
    conditions,
    error: conditionsError,
    status: conditionsStatus,
  } = useConditions(companyId, 'all');
  const { compliance, error: complianceError } =
    useConditionsCompliance(companyId);
  const {
    error: licensesError,
    licenses,
    loadLicenses,
    requestedCustomerId,
    status: licensesStatus,
  } = useLicensesPanel();

  useEffect(() => {
    if (companyId) void loadLicenses(companyId);
  }, [companyId, loadLicenses]);

  const licensesSettledForCompany =
    requestedCustomerId === companyId &&
    (licensesStatus === 'success' || licensesStatus === 'error');
  const archivedLicenseIds = new Set(
    licenses
      .filter((license) => isArchivedLicense(license.status))
      .map((license) => license.id)
  );
  const visibleConditions = conditions
    .filter((condition) => !archivedLicenseIds.has(condition.licenseId))
    .slice()
    .sort((left, right) => getRiskOrder(left) - getRiskOrder(right))
    .slice(0, 3);
  const isLoading =
    conditionsStatus === 'idle' ||
    conditionsStatus === 'loading' ||
    (!compliance && !complianceError) ||
    !licensesSettledForCompany;
  const error =
    conditionsError ||
    complianceError ||
    (licensesStatus === 'error' && requestedCustomerId === companyId
      ? licensesError
      : null);

  return (
    <article
      aria-label="Condicionantes Ambientais"
      className="rounded-panel flex flex-col gap-5 border border-border bg-surface p-6 shadow-control max-[520px]:p-5"
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="m-0 text-base font-bold text-text-primary">
          Condicionantes Ambientais
        </h2>
        <Link
          className="shrink-0 text-xs font-bold text-primary-strong no-underline hover:underline"
          to={buildCompanyRoutes.conditions(companyId)}
        >
          Ver Monitor <span aria-hidden="true">→</span>
        </Link>
      </header>

      {compliance ? (
        <ComplianceProgressBar compliance={compliance} variant="compact" />
      ) : null}

      {isLoading ? (
        <p className="m-0 text-sm text-text-secondary" role="status">
          Carregando condicionantes ambientais...
        </p>
      ) : null}

      {error ? (
        <p className="m-0 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {!isLoading && !error && visibleConditions.length === 0 ? (
        <p className="m-0 text-sm text-text-secondary">
          Nenhuma condicionante cadastrada para esta empresa.
        </p>
      ) : null}

      {!isLoading && !error && visibleConditions.length > 0 ? (
        <ul
          aria-label="Condicionantes prioritárias"
          className="m-0 divide-y divide-border p-0"
        >
          {visibleConditions.map((condition) => (
            <li
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              key={condition.id}
            >
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold text-text-primary">
                  {condition.name}
                </p>
                <p className="mt-1 mb-0 text-xs text-text-secondary">
                  {condition.environmentalDescriptor} · Vencimento:{' '}
                  {formatDueDate(condition.dueDate)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-control px-2 py-1 text-[11px] font-bold ${getBadgeTone(condition.riskLevel)}`}
              >
                {getBadgeLabel(condition.riskLevel)}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

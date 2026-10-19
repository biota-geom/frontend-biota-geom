import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import type { Company } from '@/features/companies/types';
import { FullPageLoader } from '../../../components/feedback/FullPageLoader';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useCompanyContext } from '../../../features/companies/useCompanyContext';
import type { LicenseDashboard } from '../../../features/licenses/types';
import { ApiError } from '../../../services/api/apiError';
import { getLicenseDashboard } from '../../../services/api/licensesApi';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';
import { EnvironmentalObligationsDashboardCard } from './components/EnvironmentalObligationsDashboardCard';
import {
  LicenseDashboardCard,
  LicenseDashboardSkeleton,
} from './components/LicenseDashboardCard';

const DASHBOARD_ERROR_MESSAGE =
  'Não foi possível carregar o resumo de licenças.';

type DashboardRequestResult =
  | {
      companyId: string;
      attempt: number;
      dashboard: LicenseDashboard;
      error: null;
    }
  | {
      companyId: string;
      attempt: number;
      dashboard: null;
      error: string;
    };

/*
 * The company in scope is fetched once by CompanyLayout, which wraps every
 * company route — this page only reads the resulting state, so the dashboard
 * and the header can never disagree about which company is loaded. An
 * unresolvable id never reaches here: the layout renders its own not-found
 * state in place of this route.
 */
export function CompanyDashboardPage() {
  const breadcrumbs = useCompanyBreadcrumbs('Painel');
  const company = useCompanyContext((state) => state.company);
  const status = useCompanyContext((state) => state.status);

  return (
    <CompanyDashboardContent
      breadcrumbs={breadcrumbs}
      isLoading={status !== 'success' || !company}
      company={company}
    />
  );
}

type CompanyDashboardContentProps = {
  breadcrumbs: ReturnType<typeof useCompanyBreadcrumbs>;
  isLoading: boolean;
  company: Company | null;
};

function CompanyDashboardContent({
  breadcrumbs,
  isLoading,
  company,
}: CompanyDashboardContentProps) {
  const [result, setResult] = useState<DashboardRequestResult | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!company) return;

    let isCurrentRequest = true;

    getLicenseDashboard(company.id)
      .then((result) => {
        if (isCurrentRequest) {
          setResult({
            companyId: company.id,
            attempt: retryCount,
            dashboard: result,
            error: null,
          });
        }
      })
      .catch((requestError: unknown) => {
        if (!isCurrentRequest) return;
        setResult({
          companyId: company.id,
          attempt: retryCount,
          dashboard: null,
          error:
            requestError instanceof ApiError
              ? requestError.message
              : DASHBOARD_ERROR_MESSAGE,
        });
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [company, retryCount]);

  if (isLoading || !company) return <FullPageLoader />;
  const currentResult =
    result?.companyId === company.id && result.attempt === retryCount
      ? result
      : null;
  const dashboard = currentResult?.dashboard ?? null;
  const error = currentResult?.error ?? null;

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      headerAside={
        dashboard ? (
          <div
            aria-label="Indicadores do painel"
            className="flex flex-wrap items-center justify-end gap-2 max-[720px]:justify-start"
          >
            <span className="rounded-control bg-[#d8f8ea] px-3 py-2 text-xs font-extrabold text-primary-strong">
              {dashboard.header.activeLicenses ?? 0} Licenças Ativas
            </span>
            <span className="rounded-control bg-red-100 px-3 py-2 text-xs font-extrabold text-red-600">
              {dashboard.header.pendingItems ?? 0}{' '}
              {(dashboard.header.pendingItems ?? 0) === 1
                ? 'Pendência'
                : 'Pendências'}
            </span>
          </div>
        ) : null
      }
      subtitle={`Monitoramento de conformidade ambiental • ${company?.name}`}
      title="Painel de controle"
    >
      <div className="grid grid-cols-2 items-stretch gap-4 max-[900px]:grid-cols-1">
        <div>
          {error ? (
            <div
              className="rounded-panel flex flex-wrap items-center justify-between gap-4 border border-red-200 bg-red-50 p-4 text-sm text-red-600"
              role="alert"
            >
              <p className="m-0">{error}</p>
              <Button
                onClick={() => setRetryCount((count) => count + 1)}
                type="button"
                variant="action"
              >
                Tentar novamente
              </Button>
            </div>
          ) : dashboard ? (
            <LicenseDashboardCard
              companyId={company.id}
              dashboard={dashboard}
            />
          ) : (
            <LicenseDashboardSkeleton />
          )}
        </div>
        <EnvironmentalObligationsDashboardCard />
      </div>
    </PageScaffold>
  );
}

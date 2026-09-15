import { FullPageLoader } from '../../../components/feedback/FullPageLoader';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useCompanyContext } from '../../../features/companies/useCompanyContext';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';

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
    />
  );
}

type CompanyDashboardContentProps = {
  breadcrumbs: ReturnType<typeof useCompanyBreadcrumbs>;
  isLoading: boolean;
};

function CompanyDashboardContent({
  breadcrumbs,
  isLoading,
}: CompanyDashboardContentProps) {
  if (isLoading) return <FullPageLoader />;

  return (
    <PageScaffold
      breadcrumbs={breadcrumbs}
      subtitle="Monitoramento de conformidade ambiental no contexto da empresa."
      title="Painel de controle"
    >
      <section
        aria-label="Resumo da empresa"
        className="rounded-panel border border-border bg-surface p-8 shadow-control max-[640px]:p-6"
      >
        <p className="m-0 text-base leading-[1.6] text-text-secondary">
          O escopo da empresa foi carregado e está disponível para as próximas
          áreas do sistema.
        </p>
      </section>
    </PageScaffold>
  );
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { APP_ROUTES } from '../../../app/router/routes';
import { FullPageLoader } from '../../../components/feedback/FullPageLoader';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useCompanyContext } from '../../../features/companies/useCompanyContext';
import { getCompanyById } from '../../../services/api/companiesApi';
import { useCompanyBreadcrumbs } from '../useCompanyBreadcrumbs';

export function CompanyDashboardPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const breadcrumbs = useCompanyBreadcrumbs('Painel');
  const setCompany = useCompanyContext((state) => state.setCompany);
  const clearCompany = useCompanyContext((state) => state.clearCompany);
  const company = useCompanyContext((state) => state.company);
  const [loadState, setLoadState] = useState<{
    companyId: string | undefined;
    status: 'loading' | 'error' | 'success';
  }>({ companyId, status: 'loading' });

  useEffect(() => {
    if (!companyId) return;

    let isCurrentRequest = true;
    clearCompany();

    void getCompanyById(companyId)
      .then((company) => {
        if (isCurrentRequest) {
          setCompany(company);
          setLoadState({ companyId, status: 'success' });
        }
      })
      .catch(() => {
        if (isCurrentRequest) {
          clearCompany();
          setLoadState({ companyId, status: 'error' });
        }
      });

    return () => {
      isCurrentRequest = false;
    };
  }, [clearCompany, companyId, setCompany]);

  const requestStatus =
    loadState.companyId === companyId ? loadState.status : 'loading';

  if (requestStatus === 'error') {
    return (
      <PageScaffold
        breadcrumbs={breadcrumbs}
        subtitle="Não foi possível carregar o contexto desta empresa."
        title="Empresa não encontrada"
      >
        <section
          aria-label="Empresa não encontrada"
          className="rounded-panel border border-border bg-surface p-8 shadow-control max-[640px]:p-6"
        >
          <p className="mt-0 mb-6 max-w-[580px] text-base leading-[1.6] text-text-secondary">
            Verifique o endereço informado ou retorne à listagem de empresas.
          </p>
          <Link
            className="rounded-control inline-flex min-h-[38px] items-center justify-center bg-primary px-4 text-sm font-extrabold text-white no-underline hover:bg-primary-strong"
            to={APP_ROUTES.admin.companies}
          >
            Voltar para empresas
          </Link>
        </section>
      </PageScaffold>
    );
  }

  return (
    <CompanyDashboardContent
      breadcrumbs={breadcrumbs}
      isLoading={requestStatus === 'loading' || !company}
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

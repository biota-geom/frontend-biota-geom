import { useEffect } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';
import type { Company } from '../../features/companies/types';
import { useCompanies } from '../../features/companies/useCompanies';
import {
  useCompanyContext,
  type CompanyContextStatus,
} from '../../features/companies/useCompanyContext';
import { AppHeader, type AppNavigationItem } from './AppHeader';
import { PageScaffold } from './PageScaffold';

/*
 * The header must never announce a company the route does not actually resolve
 * to: an unknown id shows the same "not found" wording the page body uses, and
 * an in-flight load stays neutral instead of borrowing a previous name.
 */
function getCompanyContextLabel(
  companyId: string | undefined,
  contextCompany: Company | null,
  contextStatus: CompanyContextStatus
) {
  if (contextStatus === 'error') {
    return 'Empresa não encontrada';
  }

  if (contextCompany && contextCompany.id === companyId) {
    return contextCompany.name;
  }

  return 'Empresa em contexto';
}

export function CompanyLayout() {
  const { companyId } = useParams<{ companyId: string }>();

  const companies = useCompanies((state) => state.companies);
  const companiesStatus = useCompanies((state) => state.status);
  const companiesError = useCompanies((state) => state.error);
  const fetchCompanies = useCompanies((state) => state.fetchCompanies);

  const contextCompany = useCompanyContext((state) => state.company);
  const contextStatus = useCompanyContext((state) => state.status);
  const loadCompany = useCompanyContext((state) => state.loadCompany);
  const clearCompany = useCompanyContext((state) => state.clearCompany);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  /*
   * Loading the scope here rather than in CompanyDashboardPage is what makes
   * the real company name available on every sibling route (licenses,
   * obligations, legislation, ESG, documents) — and keeps it a single fetch,
   * since the dashboard now reads the same store instead of repeating it.
   */
  useEffect(() => {
    // Stryker disable next-line all: unreachable through the route table —
    // `company.root` ('/companies/:companyId') requires a non-empty segment,
    // so react-router never renders this component with an empty companyId.
    if (!companyId) return;

    void loadCompany(companyId);

    return () => clearCompany();
  }, [clearCompany, companyId, loadCompany]);

  // Stryker disable next-line all: unreachable through the route table —
  // `company.root` ('/companies/:companyId') requires a non-empty segment,
  // so react-router never renders this component with an empty companyId.
  const safeCompanyId = companyId ?? ':companyId';
  const companyNavItems: AppNavigationItem[] = [
    { label: 'Painel', to: buildCompanyRoutes.dashboard(safeCompanyId) },
    { label: 'Licenças', to: buildCompanyRoutes.licenses(safeCompanyId) },
    { label: 'Obrigações', to: buildCompanyRoutes.obligations(safeCompanyId) },
    { label: 'Legislação', to: buildCompanyRoutes.legislation(safeCompanyId) },
    { label: 'ESG', to: buildCompanyRoutes.indicators(safeCompanyId) },
    { label: 'Documentos', to: buildCompanyRoutes.documents(safeCompanyId) },
  ];

  return (
    <>
      <AppHeader
        activeCompanyId={companyId}
        companies={companies}
        companiesError={companiesError}
        contextLabel={getCompanyContextLabel(
          companyId,
          contextCompany,
          contextStatus
        )}
        isLoadingCompanies={
          companiesStatus === 'idle' || companiesStatus === 'loading'
        }
        navItems={companyNavItems}
      />
      {contextStatus === 'error' ? <CompanyNotFound /> : <Outlet />}
    </>
  );
}

/*
 * Rendered in place of the child route so an unresolvable :companyId reads the
 * same way everywhere — the header and the body of every company route agree
 * that there is no company, instead of the dashboard alone knowing about it.
 */
function CompanyNotFound() {
  return (
    <PageScaffold
      breadcrumbs={[
        { label: 'Empresas', to: APP_ROUTES.admin.companies },
        { label: 'Empresa não encontrada' },
      ]}
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

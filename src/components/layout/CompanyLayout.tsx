import { Outlet, useParams } from 'react-router-dom';
import { buildCompanyRoutes } from '../../app/router/routes';
import { getMockCompanyById } from '../../features/companies/getMockCompanyById';
import { AppHeader, type AppNavigationItem } from './AppHeader';

function getCompanyContextLabel(companyId?: string) {
  return getMockCompanyById(companyId)?.name ?? 'Empresa em contexto';
}

export function CompanyLayout() {
  const { companyId } = useParams<{ companyId: string }>();
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
        contextLabel={getCompanyContextLabel(companyId)}
        navItems={companyNavItems}
      />
      <Outlet />
    </>
  );
}

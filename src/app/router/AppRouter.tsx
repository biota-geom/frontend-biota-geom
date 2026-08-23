import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from 'react-router-dom';
import { AdminLayout } from '../../components/layout/AdminLayout';
import { CompanyLayout } from '../../components/layout/CompanyLayout';
import { AdminCompaniesPage } from '../../pages/admin/Companies/AdminCompaniesPage';
import { AdminIndicatorsPage } from '../../pages/admin/Indicators/AdminIndicatorsPage';
import { AdminLegislationPage } from '../../pages/admin/Legislation/AdminLegislationPage';
import { CompanyDashboardPage } from '../../pages/company/Dashboard/CompanyDashboardPage';
import { CompanyDocumentsPage } from '../../pages/company/Documents/CompanyDocumentsPage';
import { CompanyIndicatorsPage } from '../../pages/company/Indicators/CompanyIndicatorsPage';
import { LicenseDetailsPage } from '../../pages/company/LicenseDetails/LicenseDetailsPage';
import { CompanyLegislationPage } from '../../pages/company/Legislation/CompanyLegislationPage';
import { CompanyLicensesPage } from '../../pages/company/Licenses/CompanyLicensesPage';
import { CompanyObligationsPage } from '../../pages/company/Obligations/CompanyObligationsPage';
import { LoginPage } from '../../pages/Login/LoginPage';
import { APP_ROUTES, buildCompanyRoutes } from './routes';

function CompanyRootRedirect() {
  const { companyId } = useParams<{ companyId: string }>();

  if (!companyId) {
    return <Navigate to={APP_ROUTES.admin.companies} replace />;
  }

  return <Navigate to={buildCompanyRoutes.dashboard(companyId)} replace />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={APP_ROUTES.root}
        element={<Navigate to={APP_ROUTES.login} replace />}
      />
      <Route path={APP_ROUTES.login} element={<LoginPage />} />

      <Route path={APP_ROUTES.admin.root} element={<AdminLayout />}>
        <Route
          index
          element={<Navigate to={APP_ROUTES.admin.companies} replace />}
        />
        <Route path="companies" element={<AdminCompaniesPage />} />
        <Route path="legislation" element={<AdminLegislationPage />} />
        <Route path="indicators" element={<AdminIndicatorsPage />} />
      </Route>

      <Route path={APP_ROUTES.company.root} element={<CompanyLayout />}>
        <Route index element={<CompanyRootRedirect />} />
        <Route path="dashboard" element={<CompanyDashboardPage />} />
        <Route path="licenses" element={<CompanyLicensesPage />} />
        <Route path="licenses/:licenseId" element={<LicenseDetailsPage />} />
        <Route path="obligations" element={<CompanyObligationsPage />} />
        <Route path="legislation" element={<CompanyLegislationPage />} />
        <Route path="indicators" element={<CompanyIndicatorsPage />} />
        <Route path="documents" element={<CompanyDocumentsPage />} />
      </Route>

      <Route path="*" element={<Navigate to={APP_ROUTES.login} replace />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

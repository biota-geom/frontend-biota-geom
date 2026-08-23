import { Outlet } from 'react-router-dom';
import { APP_ROUTES } from '../../app/router/routes';
import { AppHeader, type AppNavigationItem } from './AppHeader';

const adminNavItems: AppNavigationItem[] = [
  { label: 'Empresas', to: APP_ROUTES.admin.companies },
  { label: 'Legislação', to: APP_ROUTES.admin.legislation },
  { label: 'Indicadores', to: APP_ROUTES.admin.indicators },
];

export function AdminLayout() {
  return (
    <>
      <AppHeader navItems={adminNavItems} />
      <Outlet />
    </>
  );
}

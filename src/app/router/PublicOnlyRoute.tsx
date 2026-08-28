import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from '../../components/feedback/FullPageLoader';
import { useAuth } from '../../features/auth/useAuth';
import { APP_ROUTES } from './routes';

interface NavigationState {
  from?: { pathname: string };
}

export function PublicOnlyRoute() {
  const status = useAuth((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <FullPageLoader />;
  }

  if (status === 'authenticated') {
    const state = location.state as NavigationState | null;
    const redirectTo = state?.from?.pathname ?? APP_ROUTES.admin.companies;
    return <Navigate replace to={redirectTo} />;
  }

  return <Outlet />;
}

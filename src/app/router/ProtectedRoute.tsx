import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from '../../components/feedback/FullPageLoader';
import { useAuth } from '../../features/auth/useAuth';
import { APP_ROUTES } from './routes';

export function ProtectedRoute() {
  const status = useAuth((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <FullPageLoader />;
  }

  if (status === 'unauthenticated') {
    return (
      <Navigate replace state={{ from: location }} to={APP_ROUTES.login} />
    );
  }

  return <Outlet />;
}

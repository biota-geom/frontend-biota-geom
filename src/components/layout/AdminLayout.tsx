import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';

export function AdminLayout() {
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}

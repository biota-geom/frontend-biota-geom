import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter, Outlet } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { useAlerts } from '../../features/alerts/useAlerts';
import { MOCK_AUTH_USER, seedAuthState } from '../mocks/renderWithAuth';

vi.mock('../../services/api/alertsApi', () => ({
  getUnreadAlertsCount: vi.fn(),
  listAlerts: vi.fn(),
}));
vi.mock('../../components/layout/AdminLayout', () => ({
  AdminLayout: ProbeLayout,
}));
vi.mock('../../components/layout/CompanyLayout', () => ({
  CompanyLayout: ProbeLayout,
}));
vi.mock('../../pages/admin/Companies/AdminCompaniesPage', () => ({
  AdminCompaniesPage: () => <p>Lista de empresas</p>,
}));
vi.mock('../../pages/company/Dashboard/CompanyDashboardPage', () => ({
  CompanyDashboardPage: () => <p>Painel da empresa</p>,
}));
vi.mock('../../pages/Login/LoginPage', () => ({
  LoginPage: () => <p>Login</p>,
}));

const { getUnreadAlertsCount, listAlerts } =
  await import('../../services/api/alertsApi');

function ProbeLayout() {
  const { unreadCount, countStatus } = useAlerts();
  return (
    <>
      <span data-testid="count">
        {countStatus}:{unreadCount}
      </span>
      <Link to="/admin/companies">Empresas</Link>
      <Link to="/companies/company-1/dashboard">Abrir empresa</Link>
      <Outlet />
    </>
  );
}

describe('alerts authenticated route scope', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getUnreadAlertsCount).mockResolvedValue(4);
    seedAuthState({ status: 'authenticated', user: MOCK_AUTH_USER });
  });

  it('shares the same provider across admin and company navigation', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/companies']}>
        <AppRoutes />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('success:4')
    );
    await user.click(screen.getByRole('link', { name: 'Abrir empresa' }));
    expect(screen.getByText('Painel da empresa')).toBeInTheDocument();
    expect(screen.getByTestId('count')).toHaveTextContent('success:4');
    await user.click(screen.getByRole('link', { name: 'Empresas' }));
    expect(screen.getByText('Lista de empresas')).toBeInTheDocument();
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
    expect(listAlerts).not.toHaveBeenCalled();
  });

  it('does not mount the provider for unauthenticated access', () => {
    seedAuthState();
    render(
      <MemoryRouter initialEntries={['/admin/companies']}>
        <AppRoutes />
      </MemoryRouter>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(getUnreadAlertsCount).not.toHaveBeenCalled();
  });

  it('removes the authenticated scope on logout', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/companies']}>
        <AppRoutes />
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByTestId('count')).toHaveTextContent('success:4')
    );
    act(() => seedAuthState());
    expect(screen.getByText('Login')).toBeInTheDocument();
    act(() => window.dispatchEvent(new Event('focus')));
    expect(getUnreadAlertsCount).toHaveBeenCalledTimes(1);
  });
});

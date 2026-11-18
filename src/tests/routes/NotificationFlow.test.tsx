import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation, useParams } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { authStorage } from '../../features/auth/authStorage';
import type { AlertWire } from '../../services/api/types';
import { MOCK_AUTH_USER, seedAuthState } from '../mocks/renderWithAuth';

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn().mockImplementation(async (id: string) => ({
    id,
    name: 'Empresa em contexto',
    status: 'active',
    segment: 'Indústria',
    location: 'MG',
  })),
}));
vi.mock('../../pages/company/Dashboard/CompanyDashboardPage', () => ({
  CompanyDashboardPage: () => <p>Painel de teste</p>,
}));
vi.mock('../../pages/company/LicenseDetails/LicenseDetailsPage', () => ({
  LicenseDetailsPage: LicenseProbe,
}));
vi.mock('../../pages/Login/LoginPage', () => ({
  LoginPage: () => <p>Login</p>,
}));

function LicenseProbe() {
  const { companyId, licenseId } = useParams();
  return (
    <p>
      Licença: {companyId}/{licenseId}
    </p>
  );
}

function LocationProbe() {
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;
  return (
    <span data-testid="location">
      {location.pathname}|{state?.from?.pathname}
    </span>
  );
}

const MOCK_ALERT: AlertWire = {
  id: 'alert-1',
  type: 'LICENSE_EXPIRATION',
  severity: 'HIGH',
  status: 'OPEN',
  title: 'Licença vencida',
  message: 'LO 123/2024',
  due_date: '2026-11-10T00:00:00.000Z',
  customer: { id: 'company-1', name: 'Unidade Contagem' },
  license: { id: 'license-1', type: 'LO', process_number: '123/2024' },
  condition: null,
  created_at: '2026-11-05T09:00:00.000Z',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function stubAlertsHttp({
  alreadyRead = false,
  patchStatus = 200,
  failRevalidation = false,
} = {}) {
  let read = alreadyRead;
  let patched = false;
  return vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname === '/api/alerts/unread-count') {
        if (patched && failRevalidation)
          return json({ message: 'Contador indisponível.' }, 503);
        return json({ count: read ? 0 : 1 });
      }
      if (url.pathname === '/api/alerts' && init?.method === 'GET') {
        expect(['OPEN,READ', 'OPEN']).toContain(url.searchParams.get('status'));
        expect(url.searchParams.get('page_size')).toBe('10');
        return json({
          items: [{ ...MOCK_ALERT, status: read ? 'READ' : 'OPEN' }],
          total: 1,
          page: 1,
          page_size: 10,
        });
      }
      if (url.pathname === '/api/alerts/alert-1' && init?.method === 'PATCH') {
        if (patchStatus !== 200)
          return json({ message: 'Notificação não encontrada.' }, patchStatus);
        patched = true;
        read = true;
        return json({ ...MOCK_ALERT, status: 'READ' });
      }
      throw new Error(`Unexpected request: ${init?.method} ${url.pathname}`);
    });
}

function renderFlow(path = '/companies/other-company/dashboard') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('notification HTTP and navigation flow', () => {
  beforeEach(() => {
    seedAuthState({ status: 'authenticated', user: MOCK_AUTH_USER });
    authStorage.setTokens('test-access-token', 'test-refresh-token');
  });
  afterEach(() => vi.restoreAllMocks());

  it.each([false, true])(
    'marks read through authenticated HTTP and navigates even if count refresh fails (%s)',
    async (failRevalidation) => {
      const fetchMock = stubAlertsHttp({ failRevalidation });
      const user = userEvent.setup();
      renderFlow();
      await user.click(
        await screen.findByRole('button', { name: 'Notificações, 1 não lida' })
      );
      await user.click(
        await screen.findByRole('button', { name: 'Licença vencida' })
      );
      expect(
        await screen.findByText('Licença: company-1/license-1')
      ).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      await waitFor(() =>
        expect(
          screen.queryByTestId('notification-count')
        ).not.toBeInTheDocument()
      );
      const patches = fetchMock.mock.calls.filter(
        ([, init]) => init?.method === 'PATCH'
      );
      expect(patches).toHaveLength(1);
      expect(patches[0][1]).toMatchObject({
        body: JSON.stringify({ status: 'READ' }),
        headers: { Authorization: 'Bearer test-access-token' },
      });
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/companies/company-1/licenses/license-1'
      );
    }
  );

  it('navigates an already-read alert without writing to the backend', async () => {
    const fetchMock = stubAlertsHttp({ alreadyRead: true });
    const user = userEvent.setup();
    renderFlow();
    await user.click(
      await screen.findByRole('button', { name: 'Notificações, 0 não lidas' })
    );
    await user.click(
      await screen.findByRole('button', { name: 'Licença vencida' })
    );
    expect(
      await screen.findByText('Licença: company-1/license-1')
    ).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([, init]) => init?.method === 'PATCH')
    ).toHaveLength(0);
  });

  it('keeps the notification unread and the current route after a 404', async () => {
    stubAlertsHttp({ patchStatus: 404 });
    const user = userEvent.setup();
    renderFlow();
    await user.click(
      await screen.findByRole('button', { name: 'Notificações, 1 não lida' })
    );
    await user.click(
      await screen.findByRole('button', { name: 'Licença vencida' })
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Notificação não encontrada.'
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('notification-count')).toHaveTextContent('1');
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/companies/other-company/dashboard'
    );
    expect(
      within(screen.getByRole('listitem')).getByText('Não lida')
    ).toBeInTheDocument();
  });

  it('opens the protected notification center through Ver todas', async () => {
    stubAlertsHttp();
    const user = userEvent.setup();
    renderFlow();
    await user.click(
      await screen.findByRole('button', { name: 'Notificações, 1 não lida' })
    );
    await user.click(screen.getByRole('link', { name: 'Ver todas' }));
    expect(
      await screen.findByRole('heading', { name: 'Central de notificações' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'Filtros de notificações' })
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Não lidas' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/admin/notifications'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('preserves the central destination when redirecting an unauthenticated user', () => {
    const fetchMock = stubAlertsHttp();
    seedAuthState();
    renderFlow('/admin/notifications');
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/login|/admin/notifications'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

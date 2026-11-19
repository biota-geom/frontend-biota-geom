import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertsContext } from '../../features/alerts/useAlerts';
import type { Alert, AlertsPage } from '../../features/alerts/types';
import { useCompanies } from '../../features/companies/useCompanies';
import type { CompanyListItem } from '../../features/companies/types';
import { AdminNotificationsPage } from '../../pages/admin/Notifications/AdminNotificationsPage';
import {
  listAlerts,
  markAllAlertsAsRead,
  updateAlertStatus,
} from '../../services/api/alertsApi';

const apiState = vi.hoisted(() => ({
  resolved: false,
  readAll: false,
  noUnread: false,
}));

vi.mock('../../services/api/alertsApi', () => ({
  listAlerts: vi.fn(),
  markAllAlertsAsRead: vi.fn(),
  updateAlertStatus: vi.fn(),
}));

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

const customersApi = await import('../../services/api/customersApi');

const COMPANY: CompanyListItem = {
  id: 'company-1',
  name: 'Unidade Contagem',
  status: 'active',
  segment: 'Indústria',
  location: 'Contagem - MG',
  conformityPercentage: 90,
  totalLicenses: 2,
  updatedAt: '2026-11-05T09:00:00.000Z',
};

const ALERT: Alert = {
  id: 'alert-1',
  type: 'CONDITION_DUE',
  severity: 'HIGH',
  status: 'OPEN',
  title: 'Condicionante vence em 5 dias',
  message: 'Monitoramento de efluentes — LO 123/2024',
  dueDate: '2026-11-10T00:00:00.000Z',
  customer: { id: COMPANY.id, name: COMPANY.name },
  license: { id: 'license-1', type: 'LO', processNumber: '123/2024' },
  condition: { id: 'condition-1', name: 'Monitoramento de efluentes' },
  createdAt: '2026-11-05T09:00:00.000Z',
};

function LocationProbe() {
  const { pathname } = useLocation();
  return <p data-testid="location">{pathname}</p>;
}

function renderPage() {
  return render(
    <AlertsContext.Provider
      value={{
        unreadCount: 1,
        countStatus: 'success',
        countError: null,
        alerts: { items: [ALERT], total: 1, page: 1, pageSize: 10 },
        listStatus: 'success',
        listError: null,
        isOpen: false,
        setOpen: vi.fn(),
        refreshAlerts: vi.fn().mockResolvedValue(undefined),
        pendingReadIds: [],
        readErrors: {},
        markAsRead: vi.fn().mockResolvedValue({ ...ALERT, status: 'READ' }),
      }}
    >
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <AdminNotificationsPage />
        <LocationProbe />
      </MemoryRouter>
    </AlertsContext.Provider>
  );
}

describe('AdminNotificationsPage', () => {
  beforeEach(() => {
    apiState.resolved = false;
    apiState.readAll = false;
    apiState.noUnread = false;
    useCompanies.setState({ companies: [], status: 'idle', error: null });
    vi.mocked(customersApi.listCompanies).mockResolvedValue([COMPANY]);
    vi.mocked(listAlerts).mockImplementation(
      async (options): Promise<AlertsPage> => {
        if (apiState.noUnread && options?.status?.[0] === 'OPEN')
          return { items: [], total: 0, page: 1, pageSize: 10 };
        if (apiState.readAll && options?.status?.includes('OPEN'))
          return { items: [], total: 0, page: 1, pageSize: 10 };
        const status = apiState.resolved
          ? 'RESOLVED'
          : (options?.status?.[0] ?? 'OPEN');
        return {
          items: [{ ...ALERT, status }],
          total: 23,
          page: options?.page ?? 1,
          pageSize: options?.pageSize ?? 10,
        };
      }
    );
    vi.mocked(markAllAlertsAsRead).mockImplementation(async () => {
      apiState.readAll = true;
      return 1;
    });
    vi.mocked(updateAlertStatus).mockImplementation(async (_id, status) => {
      apiState.resolved = status === 'RESOLVED';
      return { ...ALERT, status };
    });
  });

  it('defaults to unread, then switches to unresolved when there are no unread alerts', async () => {
    apiState.noUnread = true;
    renderPage();

    await waitFor(() => {
      expect(
        screen.getByRole('tab', { name: 'Não resolvidas' })
      ).toHaveAttribute('aria-selected', 'true');
    });
    expect(listAlerts).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ status: ['OPEN'] })
    );
    expect(listAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: ['OPEN', 'READ'] })
    );
  });

  it('passes company, type, and severity filters to the API', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Filtrar por empresa' }),
      COMPANY.id
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filtrar por tipo' }),
      'CONDITION_DUE'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filtrar por severidade' }),
      'HIGH'
    );

    await waitFor(() => {
      expect(listAlerts).toHaveBeenLastCalledWith({
        status: ['OPEN'],
        customerId: COMPANY.id,
        type: ['CONDITION_DUE'],
        severity: ['HIGH'],
        page: 1,
        pageSize: 10,
      });
    });
    expect(
      await screen.findByText('23 notificações encontradas')
    ).toBeInTheDocument();
  });

  it('marks all selected-company alerts as read and refreshes the bell count', async () => {
    const user = userEvent.setup();
    const refreshAlerts = vi.fn().mockResolvedValue(undefined);
    renderPageWithRefresh(refreshAlerts);
    await user.selectOptions(
      await screen.findByRole('combobox', { name: 'Filtrar por empresa' }),
      COMPANY.id
    );

    await user.click(
      screen.getByRole('button', { name: 'Marcar todas como lidas' })
    );

    await waitFor(() => {
      expect(markAllAlertsAsRead).toHaveBeenCalledWith(COMPANY.id);
      expect(refreshAlerts).toHaveBeenCalled();
      expect(
        screen.getByText('Não há notificações não lidas.')
      ).toBeInTheDocument();
    });
  });

  it('shows resolved notifications in both resolved and read tabs', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole('heading', { name: ALERT.title });

    await user.click(
      screen.getByRole('button', { name: 'Marcar como resolvida' })
    );
    await user.click(screen.getByRole('tab', { name: 'Resolvidas' }));

    await waitFor(() => {
      expect(updateAlertStatus).toHaveBeenCalledWith(ALERT.id, 'RESOLVED');
      expect(listAlerts).toHaveBeenLastCalledWith({
        status: ['RESOLVED'],
        customerId: undefined,
        type: undefined,
        severity: undefined,
        page: 1,
        pageSize: 10,
      });
    });
    expect(
      await screen.findByRole('heading', { name: ALERT.title })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Lidas' }));
    await waitFor(() => {
      expect(listAlerts).toHaveBeenLastCalledWith({
        status: ['READ', 'RESOLVED'],
        customerId: undefined,
        type: undefined,
        severity: undefined,
        page: 1,
        pageSize: 10,
      });
    });
    expect(
      await screen.findByRole('heading', { name: ALERT.title })
    ).toBeInTheDocument();
  });

  it('returns to the last available page after resolving its only alert', async () => {
    const user = userEvent.setup();
    vi.mocked(listAlerts).mockImplementation(async ({ page = 1 } = {}) => ({
      items: apiState.resolved && page === 2 ? [] : [ALERT],
      total: apiState.resolved ? 10 : 11,
      page,
      pageSize: 10,
    }));

    renderPage();
    await user.click(await screen.findByRole('button', { name: /pr.xima/i }));
    expect(await screen.findByText(/2 de 2/)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Marcar como resolvida' })
    );

    expect(await screen.findByText(/1 de 1/)).toBeInTheDocument();
  });

  it('marks an unread notification as read before opening its license', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Abrir' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/companies/company-1/licenses/license-1'
      );
    });
  });
});

function renderPageWithRefresh(refreshAlerts: () => Promise<void>) {
  return render(
    <AlertsContext.Provider
      value={{
        unreadCount: 1,
        countStatus: 'success',
        countError: null,
        alerts: { items: [ALERT], total: 1, page: 1, pageSize: 10 },
        listStatus: 'success',
        listError: null,
        isOpen: false,
        setOpen: vi.fn(),
        refreshAlerts,
        pendingReadIds: [],
        readErrors: {},
        markAsRead: vi.fn().mockResolvedValue({ ...ALERT, status: 'READ' }),
      }}
    >
      <MemoryRouter initialEntries={['/admin/notifications']}>
        <AdminNotificationsPage />
        <LocationProbe />
      </MemoryRouter>
    </AlertsContext.Provider>
  );
}

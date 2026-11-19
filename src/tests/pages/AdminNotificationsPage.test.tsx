import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ALERT_MESSAGES } from '../../features/alerts/alertMessages';
import { AlertsContext } from '../../features/alerts/useAlerts';
import type { Alert, AlertsPage } from '../../features/alerts/types';
import { useCompanies } from '../../features/companies/useCompanies';
import type { CompanyListItem } from '../../features/companies/types';
import { AdminNotificationsPage } from '../../pages/admin/Notifications/AdminNotificationsPage';
import { ApiError } from '../../services/api/apiError';
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

function renderPage(
  markAsRead = vi.fn().mockResolvedValue({ ...ALERT, status: 'READ' })
) {
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
        markAsRead,
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

  it('lists the four tabs of the task and stays on the unread one even when it is empty', async () => {
    apiState.noUnread = true;
    renderPage();

    expect(
      (await screen.findAllByRole('tab')).map((tab) => tab.textContent)
    ).toEqual(['Não lidas', 'Lidas', 'Resolvidas', 'Todas']);
    expect(
      await screen.findByText('Não há notificações não lidas.')
    ).toBeVisible();
    expect(screen.getByRole('tab', { name: 'Não lidas' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(listAlerts).toHaveBeenCalledTimes(1);
    expect(listAlerts).toHaveBeenCalledWith(
      expect.objectContaining({ status: ['OPEN'] })
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

  it('moves a resolved notification to the resolved tab and keeps the read tab to READ only', async () => {
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
        status: ['READ'],
        customerId: undefined,
        type: undefined,
        severity: undefined,
        page: 1,
        pageSize: 10,
      });
    });

    await user.click(screen.getByRole('tab', { name: 'Todas' }));
    await waitFor(() => {
      expect(listAlerts).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: ['OPEN', 'READ', 'RESOLVED'] })
      );
    });
  });

  it('goes back a page when resolving the last item of the last page empties it', async () => {
    const user = userEvent.setup();
    // 11 alerts: ten on page 1 and one on page 2.
    let remaining = 11;
    vi.mocked(listAlerts).mockImplementation(
      async (options): Promise<AlertsPage> => {
        const page = options?.page ?? 1;
        const start = (page - 1) * 10;
        const count = Math.max(0, Math.min(10, remaining - start));
        return {
          items: Array.from({ length: count }, (_, index) => ({
            ...ALERT,
            id: `alert-${start + index}`,
            title: `Alerta ${start + index + 1}`,
          })),
          total: remaining,
          page,
          pageSize: 10,
        };
      }
    );
    vi.mocked(updateAlertStatus).mockImplementation(async (_id, status) => {
      remaining -= 1;
      return { ...ALERT, status };
    });
    renderPage();

    await user.click(await screen.findByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('Página 2 de 2')).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Marcar como resolvida' })
    );

    expect(await screen.findByText('Página 1 de 1')).toBeVisible();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(listAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });

  it('pages through the results and disables the buttons at both ends', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(await screen.findByText('Página 1 de 3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('Página 2 de 3')).toBeVisible();
    expect(listAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 10 })
    );

    await user.click(screen.getByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('Página 3 de 3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Próxima' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('Página 2 de 3')).toBeVisible();
  });

  it('goes back to the first page when a tab or filter changes', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Próxima' }));
    expect(await screen.findByText('Página 2 de 3')).toBeVisible();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Filtrar por severidade' }),
      'LOW'
    );

    expect(await screen.findByText('Página 1 de 3')).toBeVisible();
    expect(listAlerts).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, severity: ['LOW'] })
    );
  });

  it.each([
    ['Lidas', 'Não há notificações lidas.'],
    ['Resolvidas', 'Não há notificações resolvidas.'],
    ['Todas', 'Nenhuma notificação encontrada.'],
  ])('shows the empty state of the %s tab', async (tabName, message) => {
    const user = userEvent.setup();
    vi.mocked(listAlerts).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });
    renderPage();

    await user.click(await screen.findByRole('tab', { name: tabName }));

    expect(await screen.findByText(message)).toBeVisible();
    expect(
      screen.queryByRole('navigation', { name: 'Paginação das notificações' })
    ).not.toBeInTheDocument();
  });

  it('shows the API error and reloads the list on "Tentar novamente"', async () => {
    const user = userEvent.setup();
    vi.mocked(listAlerts).mockRejectedValueOnce(
      new ApiError(500, 'Falha ao carregar.')
    );
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Falha ao carregar.'
    );

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));

    expect(
      await screen.findByRole('heading', { name: ALERT.title })
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('falls back to the generic message for an unexpected load failure', async () => {
    vi.mocked(listAlerts).mockRejectedValueOnce(new Error('boom'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      ALERT_MESSAGES.listError
    );
  });

  it('shows the error and keeps the notification when resolving fails', async () => {
    const user = userEvent.setup();
    vi.mocked(updateAlertStatus).mockRejectedValue(
      new ApiError(404, 'Notificação não encontrada.')
    );
    renderPage();

    await user.click(
      await screen.findByRole('button', { name: 'Marcar como resolvida' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Notificação não encontrada.'
    );
    expect(
      screen.getByRole('heading', { name: ALERT.title })
    ).toBeInTheDocument();
  });

  it('shows a message when marking everything as read fails', async () => {
    const user = userEvent.setup();
    vi.mocked(markAllAlertsAsRead).mockRejectedValue(new Error('boom'));
    renderPage();
    await screen.findByRole('heading', { name: ALERT.title });

    await user.click(
      screen.getByRole('button', { name: 'Marcar todas como lidas' })
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível marcar as notificações como lidas.'
    );
  });

  it('opens an already read notification without marking it as read again', async () => {
    const user = userEvent.setup();
    const markAsRead = vi.fn();
    renderPage(markAsRead);
    await user.click(await screen.findByRole('tab', { name: 'Lidas' }));

    await user.click(await screen.findByRole('button', { name: 'Abrir' }));

    await waitFor(() => {
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/companies/company-1/licenses/license-1'
      );
    });
    expect(markAsRead).not.toHaveBeenCalled();
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

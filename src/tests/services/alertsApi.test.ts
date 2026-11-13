import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Alert } from '../../features/alerts/types';
import { ApiError } from '../../services/api/apiError';
import type { AlertWire } from '../../services/api/types';

vi.mock('../../services/api/http', () => ({ request: vi.fn() }));

const { request } = await import('../../services/api/http');
const { listAlerts, getUnreadAlertsCount, markAlertAsRead } =
  await import('../../services/api/alertsApi');

const MOCK_ALERT_WIRE: AlertWire = {
  id: 'alert-1',
  type: 'CONDITION_DUE',
  severity: 'HIGH',
  status: 'OPEN',
  title: 'Condicionante vence em 5 dias',
  message: 'Monitoramento de efluentes — LO 123/2024',
  due_date: '2026-11-10T00:00:00.000Z',
  customer: { id: 'company-1', name: 'Unidade Contagem' },
  license: { id: 'license-1', type: 'LO', process_number: '123/2024' },
  condition: { id: 'condition-1', name: 'Monitoramento de efluentes' },
  created_at: '2026-11-05T09:00:00.000Z',
};

const MOCK_ALERT: Alert = {
  id: 'alert-1',
  type: 'CONDITION_DUE',
  severity: 'HIGH',
  status: 'OPEN',
  title: 'Condicionante vence em 5 dias',
  message: 'Monitoramento de efluentes — LO 123/2024',
  dueDate: '2026-11-10T00:00:00.000Z',
  customer: { id: 'company-1', name: 'Unidade Contagem' },
  license: { id: 'license-1', type: 'LO', processNumber: '123/2024' },
  condition: { id: 'condition-1', name: 'Monitoramento de efluentes' },
  createdAt: '2026-11-05T09:00:00.000Z',
};

describe('alertsApi', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
  });

  it('requests pending alerts with explicit defaults and maps the response', async () => {
    vi.mocked(request).mockResolvedValue({
      items: [MOCK_ALERT_WIRE],
      total: 23,
      page: 1,
      page_size: 10,
    });

    await expect(listAlerts()).resolves.toEqual({
      items: [MOCK_ALERT],
      total: 23,
      page: 1,
      pageSize: 10,
    });
    expect(request).toHaveBeenCalledExactlyOnceWith(
      '/api/alerts?status=OPEN%2CREAD&page=1&page_size=10'
    );
  });

  it('serializes custom filters and pagination and preserves server order', async () => {
    const licenseAlert: AlertWire = {
      ...MOCK_ALERT_WIRE,
      id: 'alert-2',
      type: 'LICENSE_EXPIRATION',
      severity: 'MEDIUM',
      status: 'READ',
      title: 'Licença vence em 20 dias',
      condition: null,
    };
    vi.mocked(request).mockResolvedValue({
      items: [licenseAlert, MOCK_ALERT_WIRE],
      total: 150,
      page: 2,
      page_size: 100,
    });

    const result = await listAlerts({
      status: ['READ', 'OPEN'],
      page: 2,
      pageSize: 100,
    });

    expect(request).toHaveBeenCalledExactlyOnceWith(
      '/api/alerts?status=READ%2COPEN&page=2&page_size=100'
    );
    expect(result).toEqual({
      items: [
        {
          ...MOCK_ALERT,
          id: 'alert-2',
          type: 'LICENSE_EXPIRATION',
          severity: 'MEDIUM',
          status: 'READ',
          title: 'Licença vence em 20 dias',
          condition: null,
        },
        MOCK_ALERT,
      ],
      total: 150,
      page: 2,
      pageSize: 100,
    });
  });

  it('preserves an empty page without manufacturing notifications', async () => {
    vi.mocked(request).mockResolvedValue({
      items: [],
      total: 0,
      page: 1,
      page_size: 10,
    });
    await expect(listAlerts({ status: ['OPEN'] })).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
    });
    expect(request).toHaveBeenCalledWith(
      '/api/alerts?status=OPEN&page=1&page_size=10'
    );
  });

  it.each([0, 3, 23])(
    'returns the unread count unchanged (%i)',
    async (count) => {
      vi.mocked(request).mockResolvedValue({ count });
      await expect(getUnreadAlertsCount()).resolves.toBe(count);
      expect(request).toHaveBeenCalledExactlyOnceWith(
        '/api/alerts/unread-count'
      );
    }
  );

  it('marks an alert as read and returns the updated notification', async () => {
    vi.mocked(request).mockResolvedValue({
      ...MOCK_ALERT_WIRE,
      status: 'READ',
    });
    await expect(markAlertAsRead('alert-1')).resolves.toEqual({
      ...MOCK_ALERT,
      status: 'READ',
    });
    expect(request).toHaveBeenCalledExactlyOnceWith('/api/alerts/alert-1', {
      method: 'PATCH',
      body: { status: 'READ' },
    });
  });

  it.each([
    ['list', () => listAlerts()],
    ['count', () => getUnreadAlertsCount()],
    ['read', () => markAlertAsRead('alert-1')],
  ] as const)(
    'propagates API errors from %s without a mock fallback',
    async (_name, action) => {
      const error = new ApiError(404, 'Notificação não encontrada.');
      vi.mocked(request).mockRejectedValue(error);
      await expect(action()).rejects.toBe(error);
    }
  );
});

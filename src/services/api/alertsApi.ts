import type {
  Alert,
  AlertsPage,
  AlertStatus,
} from '../../features/alerts/types';
import { request } from './http';
import type { AlertWire, AlertsPageWire, UnreadAlertsCountWire } from './types';

export interface ListAlertsOptions {
  status?: readonly AlertStatus[];
  page?: number;
  /** The backend accepts at most 100 items per page. */
  pageSize?: number;
}

function toAlert(wire: AlertWire): Alert {
  return {
    id: wire.id,
    type: wire.type,
    severity: wire.severity,
    status: wire.status,
    title: wire.title,
    message: wire.message,
    dueDate: wire.due_date,
    customer: wire.customer,
    license: {
      id: wire.license.id,
      type: wire.license.type,
      processNumber: wire.license.process_number,
    },
    condition: wire.condition,
    createdAt: wire.created_at,
  };
}

export async function listAlerts({
  status = ['OPEN', 'READ'],
  page = 1,
  pageSize = 10,
}: ListAlertsOptions = {}): Promise<AlertsPage> {
  const query = new URLSearchParams({
    status: status.join(','),
    page: String(page),
    page_size: String(pageSize),
  });
  const wire = await request<AlertsPageWire>(`/api/alerts?${query.toString()}`);

  return {
    items: wire.items.map(toAlert),
    total: wire.total,
    page: wire.page,
    pageSize: wire.page_size,
  };
}

export async function getUnreadAlertsCount(): Promise<number> {
  const wire = await request<UnreadAlertsCountWire>('/api/alerts/unread-count');
  return wire.count;
}

export async function markAlertAsRead(alertId: string): Promise<Alert> {
  const wire = await request<AlertWire>(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    body: { status: 'READ' },
  });
  return toAlert(wire);
}

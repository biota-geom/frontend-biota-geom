import type {
  Alert,
  AlertsPage,
  AlertStatus,
  AlertType,
  AlertSeverity,
} from '../../features/alerts/types';
import { request } from './http';
import type { AlertWire, AlertsPageWire, UnreadAlertsCountWire } from './types';

export interface ListAlertsOptions {
  status?: readonly AlertStatus[];
  customerId?: string;
  type?: readonly AlertType[];
  severity?: readonly AlertSeverity[];
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
  customerId,
  type,
  severity,
  page = 1,
  pageSize = 10,
}: ListAlertsOptions = {}): Promise<AlertsPage> {
  const query = new URLSearchParams({
    status: status.join(','),
    page: String(page),
    page_size: String(pageSize),
  });
  if (customerId) query.set('customer_id', customerId);
  if (type?.length) query.set('type', type.join(','));
  if (severity?.length) query.set('severity', severity.join(','));
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
  return updateAlertStatus(alertId, 'READ');
}

export async function updateAlertStatus(
  alertId: string,
  status: Exclude<AlertStatus, 'OPEN'>
): Promise<Alert> {
  const wire = await request<AlertWire>(`/api/alerts/${alertId}`, {
    method: 'PATCH',
    body: { status },
  });
  return toAlert(wire);
}

export async function markAllAlertsAsRead(
  customerId?: string
): Promise<number> {
  const query = new URLSearchParams();
  if (customerId) query.set('customer_id', customerId);
  const suffix = query.size > 0 ? `?${query.toString()}` : '';
  const wire = await request<{ updated: number }>(
    `/api/alerts/read-all${suffix}`,
    { method: 'POST' }
  );
  return wire.updated;
}

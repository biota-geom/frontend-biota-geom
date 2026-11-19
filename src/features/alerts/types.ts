export type AlertType = 'LICENSE_EXPIRATION' | 'CONDITION_DUE';
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type AlertStatus = 'OPEN' | 'READ' | 'RESOLVED';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  /** Presentation text supplied by the backend in PT-BR. */
  title: string;
  message: string;
  dueDate: string;
  /** The company, not the authenticated tenant. */
  customer: { id: string; name: string };
  license: { id: string; type: string; processNumber: string };
  condition: { id: string; name: string } | null;
  createdAt: string;
}

export interface AlertsPage {
  items: Alert[];
  total: number;
  page: number;
  pageSize: number;
}

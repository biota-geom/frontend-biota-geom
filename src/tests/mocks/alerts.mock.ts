import type { Alert } from '../../features/alerts/types';
import type { AlertsContextValue } from '../../features/alerts/useAlerts';

export const MOCK_ALERTS_CONTEXT: AlertsContextValue = {
  unreadCount: 0,
  countStatus: 'success',
  countError: null,
  alerts: { items: [], total: 0, page: 1, pageSize: 10 },
  listStatus: 'success',
  listError: null,
  isOpen: false,
  setOpen: () => {},
  refreshAlerts: async () => {},
};

export const MOCK_NOTIFICATIONS: Alert[] = [
  {
    id: 'alert-1',
    type: 'LICENSE_EXPIRATION',
    severity: 'HIGH',
    status: 'OPEN',
    title: 'Licença vencida',
    message: 'LO 123/2024',
    dueDate: '2026-11-10T00:00:00.000Z',
    customer: { id: 'company-1', name: 'Unidade Contagem' },
    license: { id: 'license-1', type: 'LO', processNumber: '123/2024' },
    condition: null,
    createdAt: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'alert-2',
    type: 'CONDITION_DUE',
    severity: 'MEDIUM',
    status: 'READ',
    title: 'Condicionante vence em 5 dias',
    message: 'Monitoramento de efluentes — LO 456/2024',
    dueDate: '2026-11-18T00:00:00.000Z',
    customer: { id: 'company-2', name: 'Unidade Betim' },
    license: { id: 'license-2', type: 'LO', processNumber: '456/2024' },
    condition: { id: 'condition-1', name: 'Monitoramento de efluentes' },
    createdAt: '2026-11-05T09:00:00.000Z',
  },
  {
    id: 'alert-3',
    type: 'CONDITION_DUE',
    severity: 'LOW',
    status: 'OPEN',
    title: 'Lembrete de condicionante',
    message: 'Relatório de resíduos — LO 789/2024',
    dueDate: '2026-12-20T00:00:00.000Z',
    customer: { id: 'company-3', name: 'Unidade Ouro Preto' },
    license: { id: 'license-3', type: 'LO', processNumber: '789/2024' },
    condition: { id: 'condition-2', name: 'Relatório de resíduos' },
    createdAt: '2026-11-05T09:00:00.000Z',
  },
];

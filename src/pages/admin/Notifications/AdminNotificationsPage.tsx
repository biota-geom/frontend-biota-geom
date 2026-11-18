import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleAlert, Info, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { buildCompanyRoutes } from '../../../app/router/routes';
import { PageScaffold } from '../../../components/layout/PageScaffold';
import { useCompanies } from '../../../features/companies/useCompanies';
import type {
  Alert,
  AlertSeverity,
  AlertStatus,
  AlertType,
} from '../../../features/alerts/types';
import { ALERT_MESSAGES } from '../../../features/alerts/alertMessages';
import { formatAlertDueDate } from '../../../features/alerts/alertFormatting';
import { useAlerts } from '../../../features/alerts/useAlerts';
import { ApiError } from '../../../services/api/apiError';
import {
  listAlerts,
  markAllAlertsAsRead,
  updateAlertStatus,
} from '../../../services/api/alertsApi';

const PAGE_SIZE = 10;

type NotificationTab = AlertStatus | 'UNRESOLVED' | 'ALL';

const TABS: Array<{ label: string; value: NotificationTab }> = [
  { label: 'Não lidas', value: 'OPEN' },
  { label: 'Lidas', value: 'READ' },
  { label: 'Não resolvidas', value: 'UNRESOLVED' },
  { label: 'Resolvidas', value: 'RESOLVED' },
  { label: 'Todas', value: 'ALL' },
];

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const SEVERITY_ICONS = {
  HIGH: CircleAlert,
  MEDIUM: TriangleAlert,
  LOW: Info,
};

const SEVERITY_CLASSES: Record<AlertSeverity, string> = {
  HIGH: 'text-destructive',
  MEDIUM: 'text-alert-warning',
  LOW: 'text-link',
};

const EMPTY_MESSAGES: Record<NotificationTab, string> = {
  OPEN: 'Não há notificações não lidas.',
  READ: 'Não há notificações lidas.',
  UNRESOLVED: 'Não há notificações não resolvidas.',
  RESOLVED: 'Não há notificações resolvidas.',
  ALL: 'Nenhuma notificação encontrada.',
};

const CREATION_DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
});

function formatCreationDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ALERT_MESSAGES.unavailableDate
    : CREATION_DATE_FORMATTER.format(date);
}

function statusesForTab(tab: NotificationTab): AlertStatus[] {
  if (tab === 'ALL') return ['OPEN', 'READ', 'RESOLVED'];
  if (tab === 'UNRESOLVED') return ['OPEN', 'READ'];
  if (tab === 'READ') return ['READ', 'RESOLVED'];
  return [tab];
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export function AdminNotificationsPage() {
  const navigate = useNavigate();
  const {
    companies,
    status: companiesStatus,
    error: companiesError,
    fetchCompanies,
  } = useCompanies();
  const { markAsRead, refreshAlerts, readErrors } = useAlerts();
  const [tab, setTab] = useState<NotificationTab>('OPEN');
  const [customerId, setCustomerId] = useState('');
  const [type, setType] = useState<AlertType | ''>('');
  const [severity, setSeverity] = useState<AlertSeverity | ''>('');
  const [page, setPage] = useState(1);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [items, setItems] = useState<Alert[]>([]);
  const [total, setTotal] = useState(0);
  const [loadStatus, setLoadStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [pendingAlertId, setPendingAlertId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const requestSequence = useRef(0);
  const shouldFallbackToUnresolved = useRef(true);

  useEffect(() => {
    void fetchCompanies();
  }, [fetchCompanies]);

  const loadPage = useCallback(async () => {
    const requestId = ++requestSequence.current;
    setLoadStatus('loading');
    setLoadError(null);
    try {
      const result = await listAlerts({
        status: statusesForTab(tab),
        customerId: customerId || undefined,
        type: type ? [type] : undefined,
        severity: severity ? [severity] : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      if (requestId !== requestSequence.current) return;
      if (
        shouldFallbackToUnresolved.current &&
        tab === 'OPEN' &&
        page === 1 &&
        !customerId &&
        !type &&
        !severity &&
        result.total === 0
      ) {
        shouldFallbackToUnresolved.current = false;
        setTab('UNRESOLVED');
        return;
      }
      shouldFallbackToUnresolved.current = false;
      setItems(result.items);
      setTotal(result.total);
      setLoadStatus('success');
    } catch (error) {
      if (requestId !== requestSequence.current) return;
      setLoadError(errorMessage(error, ALERT_MESSAGES.listError));
      setLoadStatus('error');
    }
  }, [customerId, page, severity, tab, type]);

  useEffect(() => {
    void Promise.resolve().then(loadPage);
    return () => {
      requestSequence.current += 1;
    };
  }, [loadPage, reloadVersion]);

  function resetPageAndUpdate<T>(update: (value: T) => void, value: T) {
    setPage(1);
    update(value);
  }

  async function handleMarkAllRead() {
    setBulkPending(true);
    setActionError(null);
    try {
      await markAllAlertsAsRead(customerId || undefined);
      await Promise.all([refreshAlerts(), loadPage()]);
    } catch (error) {
      setActionError(
        errorMessage(
          error,
          'Não foi possível marcar as notificações como lidas.'
        )
      );
    } finally {
      setBulkPending(false);
    }
  }

  async function handleOpen(alert: Alert) {
    setPendingAlertId(alert.id);
    setActionError(null);
    try {
      if (alert.status === 'OPEN') {
        const updated = await markAsRead(alert);
        if (!updated) {
          setActionError(readErrors[alert.id] ?? ALERT_MESSAGES.readError);
          return;
        }
        await refreshAlerts();
      }
      void navigate(
        buildCompanyRoutes.licenseDetails(alert.customer.id, alert.license.id)
      );
    } catch (error) {
      setActionError(
        errorMessage(error, 'Não foi possível abrir a notificação.')
      );
    } finally {
      setPendingAlertId(null);
    }
  }

  async function handleResolve(alert: Alert) {
    setPendingAlertId(alert.id);
    setActionError(null);
    try {
      await updateAlertStatus(alert.id, 'RESOLVED');
      await Promise.all([refreshAlerts(), loadPage()]);
    } catch (error) {
      setActionError(
        errorMessage(error, 'Não foi possível resolver a notificação.')
      );
    } finally {
      setPendingAlertId(null);
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageScaffold
      subtitle={ALERT_MESSAGES.description}
      title={ALERT_MESSAGES.centralTitle}
      actions={[
        {
          icon: 'none',
          label: 'Marcar todas como lidas',
          disabled: bulkPending,
          onClick: () => void handleMarkAllRead(),
        },
      ]}
    >
      <section
        aria-label="Filtros de notificações"
        className="rounded-panel mb-6 flex flex-wrap items-end gap-4 border border-border bg-surface p-4"
      >
        <label className="flex min-w-[220px] flex-1 flex-col gap-1.5 text-sm font-semibold text-text-secondary">
          Empresa
          <select
            aria-label="Filtrar por empresa"
            className="rounded-control min-h-[38px] border border-border bg-surface px-3 text-text-primary"
            disabled={companiesStatus === 'loading'}
            onChange={(event) =>
              resetPageAndUpdate(setCustomerId, event.target.value)
            }
            value={customerId}
          >
            <option value="">Todas as empresas</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex min-w-[180px] flex-1 flex-col gap-1.5 text-sm font-semibold text-text-secondary">
          Tipo
          <select
            aria-label="Filtrar por tipo"
            className="rounded-control min-h-[38px] border border-border bg-surface px-3 text-text-primary"
            onChange={(event) =>
              resetPageAndUpdate(setType, event.target.value as AlertType | '')
            }
            value={type}
          >
            <option value="">Todos os tipos</option>
            <option value="LICENSE_EXPIRATION">Licença</option>
            <option value="CONDITION_DUE">Condicionante</option>
          </select>
        </label>

        <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-sm font-semibold text-text-secondary">
          Severidade
          <select
            aria-label="Filtrar por severidade"
            className="rounded-control min-h-[38px] border border-border bg-surface px-3 text-text-primary"
            onChange={(event) =>
              resetPageAndUpdate(
                setSeverity,
                event.target.value as AlertSeverity | ''
              )
            }
            value={severity}
          >
            <option value="">Todas</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </label>
      </section>

      {companiesStatus === 'error' && companiesError && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-destructive">
          <p role="alert" className="m-0">
            {companiesError}
          </p>
          <Button
            onClick={() => void fetchCompanies()}
            type="button"
            variant="subtle"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      <div
        aria-label="Status das notificações"
        className="mb-5 flex flex-wrap gap-2 border-b border-border"
        role="tablist"
      >
        {TABS.map((item) => (
          <button
            aria-selected={tab === item.value}
            className={[
              'min-h-11 border-b-2 px-4 text-sm font-semibold transition-colors',
              tab === item.value
                ? 'border-primary text-primary-strong'
                : 'border-transparent text-text-secondary hover:text-text-primary',
            ].join(' ')}
            key={item.value}
            onClick={() => resetPageAndUpdate(setTab, item.value)}
            role="tab"
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {actionError && (
        <p role="alert" className="mb-4 text-sm text-destructive">
          {actionError}
        </p>
      )}

      {loadStatus === 'loading' && (
        <p
          role="status"
          className="py-8 text-center text-sm text-text-secondary"
        >
          Carregando notificações...
        </p>
      )}

      {loadStatus === 'error' && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-panel border border-border p-4">
          <p role="alert" className="m-0 text-sm text-destructive">
            {loadError}
          </p>
          <Button
            onClick={() => setReloadVersion((version) => version + 1)}
            type="button"
            variant="subtle"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {loadStatus === 'success' && items.length === 0 && (
        <p
          role="status"
          className="py-10 text-center text-sm text-text-secondary"
        >
          {EMPTY_MESSAGES[tab]}
        </p>
      )}

      {loadStatus === 'success' && items.length > 0 && (
        <>
          <p className="mb-3 text-sm font-semibold text-text-secondary">
            {total}{' '}
            {total === 1
              ? 'notificação encontrada'
              : 'notificações encontradas'}
          </p>
          <ul
            aria-label="Notificações"
            className="m-0 flex list-none flex-col gap-3 p-0"
          >
            {items.map((alert) => {
              const Icon = SEVERITY_ICONS[alert.severity];
              const isPending = pendingAlertId === alert.id;
              return (
                <li
                  className="rounded-panel border border-border bg-surface p-5"
                  key={alert.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p
                        className={`mb-2 flex items-center gap-2 text-sm font-bold ${SEVERITY_CLASSES[alert.severity]}`}
                      >
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                        {SEVERITY_LABELS[alert.severity]}
                        <span className="font-medium text-text-secondary">
                          {alert.type === 'LICENSE_EXPIRATION'
                            ? 'Licença'
                            : 'Condicionante'}
                        </span>
                      </p>
                      <h2 className="m-0 text-base font-bold text-text-primary">
                        {alert.title}
                      </h2>
                      <p className="mt-1 mb-3 text-sm leading-relaxed text-text-secondary">
                        {alert.message}
                      </p>
                      <dl className="m-0 flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-secondary">
                        <div>
                          <dt className="inline font-semibold">Empresa: </dt>
                          <dd className="inline">{alert.customer.name}</dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">Vencimento: </dt>
                          <dd className="inline">
                            <time dateTime={alert.dueDate}>
                              {formatAlertDueDate(alert.dueDate)}
                            </time>
                          </dd>
                        </div>
                        <div>
                          <dt className="inline font-semibold">Criada em: </dt>
                          <dd className="inline">
                            <time dateTime={alert.createdAt}>
                              {formatCreationDate(alert.createdAt)}
                            </time>
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <Button
                        disabled={isPending || bulkPending}
                        onClick={() => void handleOpen(alert)}
                        type="button"
                        variant="subtle"
                      >
                        Abrir
                      </Button>
                      {alert.status !== 'RESOLVED' && (
                        <Button
                          disabled={isPending || bulkPending}
                          onClick={() => void handleResolve(alert)}
                          type="button"
                          variant="subtle"
                        >
                          Marcar como resolvida
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <nav
            aria-label="Paginação das notificações"
            className="mt-6 flex items-center justify-between gap-4"
          >
            <p className="m-0 text-sm text-text-secondary">
              Página {page} de {pageCount}
            </p>
            <div className="flex gap-2">
              <Button
                disabled={page <= 1 || pendingAlertId !== null || bulkPending}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                type="button"
                variant="subtle"
              >
                Anterior
              </Button>
              <Button
                disabled={
                  page >= pageCount || pendingAlertId !== null || bulkPending
                }
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                type="button"
                variant="subtle"
              >
                Próxima
              </Button>
            </div>
          </nav>
        </>
      )}
    </PageScaffold>
  );
}

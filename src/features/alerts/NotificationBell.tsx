import { useId } from 'react';
import { cva } from 'class-variance-authority';
import { CircleAlert, Info, TriangleAlert, X } from 'lucide-react';
import { BellIcon } from '../../components/ui/icons';
import { Button } from '../../components/ui/shadcn/button';
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from '../../components/ui/shadcn/popover';
import { formatAlertDueDate } from './alertFormatting';
import { ALERT_MESSAGES } from './alertMessages';
import type { Alert } from './types';
import { useAlerts } from './useAlerts';

const severityVariants = cva(
  'inline-flex items-center gap-1.5 text-xs font-semibold',
  {
    variants: {
      severity: {
        HIGH: 'text-destructive',
        MEDIUM: 'text-alert-warning',
        LOW: 'text-link',
      },
    },
  }
);

const itemVariants = cva(
  'rounded-control min-w-0 border border-border p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
  {
    variants: {
      unread: {
        true: 'bg-surface-soft',
        false: 'bg-surface',
      },
    },
  }
);

const SEVERITY_ICONS = { HIGH: CircleAlert, MEDIUM: TriangleAlert, LOW: Info };

function NotificationItem({ alert }: { alert: Alert }) {
  const Icon = SEVERITY_ICONS[alert.severity];
  const unread = alert.status === 'OPEN';

  return (
    <li>
      {/* TODO: mark as read and navigate when the interaction step is implemented. */}
      <article className={itemVariants({ unread })} tabIndex={0}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className={severityVariants({ severity: alert.severity })}>
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            {ALERT_MESSAGES.severity[alert.severity]}
          </span>
          <span className="text-xs text-text-secondary">
            {unread ? ALERT_MESSAGES.unread : ALERT_MESSAGES.read}
          </span>
        </div>
        <h3 className="m-0 text-sm font-bold break-words text-text-primary">
          {alert.title}
        </h3>
        <p className="mt-1 mb-3 text-sm leading-relaxed break-words text-text-secondary">
          {alert.message}
        </p>
        <p className="m-0 text-xs font-semibold break-words text-text-primary">
          {alert.customer.name}
        </p>
        <p className="mt-1 mb-0 text-xs text-text-secondary">
          {ALERT_MESSAGES.dueDate}:{' '}
          <time dateTime={alert.dueDate}>
            {formatAlertDueDate(alert.dueDate)}
          </time>
        </p>
      </article>
    </li>
  );
}

export function NotificationBell() {
  const {
    unreadCount,
    countError,
    countStatus,
    alerts,
    listStatus,
    listError,
    isOpen,
    setOpen,
    refreshAlerts,
  } = useAlerts();
  const titleId = useId();
  const descriptionId = useId();
  const items = alerts?.items.slice(0, 10) ?? [];
  const loading = listStatus === 'idle' || listStatus === 'loading';
  const retrying = countStatus === 'loading' || listStatus === 'loading';

  return (
    <Popover open={isOpen} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={ALERT_MESSAGES.triggerLabel(unreadCount)}
          type="button"
          variant="iconRound"
        >
          <BellIcon />
          {unreadCount !== null && unreadCount > 0 && (
            <span
              aria-hidden="true"
              data-testid="notification-count"
              className="absolute -top-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-surface bg-destructive px-1 text-[10px] font-bold leading-none text-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        variant="notifications"
        align="end"
        sideOffset={12}
        collisionPadding={16}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-4">
          <div>
            <h2
              id={titleId}
              className="m-0 text-base font-bold text-text-primary"
            >
              {ALERT_MESSAGES.title}
            </h2>
            <p
              id={descriptionId}
              className="mt-1 mb-0 text-xs text-text-secondary"
            >
              {ALERT_MESSAGES.description}
            </p>
          </div>
          <PopoverClose asChild>
            <Button
              variant="iconGhost"
              type="button"
              aria-label={ALERT_MESSAGES.close}
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </PopoverClose>
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3">
          {(countError || listError) && (
            <div className="mb-3 rounded-control border border-border p-3">
              <div role="alert" className="text-sm text-destructive">
                {countError && <p className="mt-0 mb-2">{countError}</p>}
                {listError && <p className="mt-0 mb-2">{listError}</p>}
              </div>
              <Button
                variant="subtle"
                type="button"
                disabled={retrying}
                onClick={() => {
                  void refreshAlerts();
                }}
              >
                {ALERT_MESSAGES.retry}
              </Button>
            </div>
          )}
          {loading && (
            <p
              role="status"
              className="m-0 p-4 text-center text-sm text-text-secondary"
            >
              {alerts ? ALERT_MESSAGES.updating : ALERT_MESSAGES.loading}
            </p>
          )}
          {listStatus === 'success' && items.length === 0 && (
            <p
              role="status"
              className="m-0 px-4 py-8 text-center text-sm text-text-secondary"
            >
              {ALERT_MESSAGES.empty}
            </p>
          )}
          {items.length > 0 && (
            <ul
              aria-label={ALERT_MESSAGES.title}
              className="m-0 flex list-none flex-col gap-2 p-0"
            >
              {items.map((alert) => (
                <NotificationItem key={alert.id} alert={alert} />
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

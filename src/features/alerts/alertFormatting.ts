import { ALERT_MESSAGES } from './alertMessages';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
});

/** Due dates are calendar dates; midnight UTC must not become the previous day. */
export function formatAlertDueDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ALERT_MESSAGES.unavailableDate
    : dateFormatter.format(date);
}

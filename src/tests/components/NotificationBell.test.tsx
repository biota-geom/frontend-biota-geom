import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationBell } from '../../features/alerts/NotificationBell';
import {
  AlertsContext,
  type AlertsContextValue,
} from '../../features/alerts/useAlerts';
import { MOCK_ALERTS_CONTEXT, MOCK_NOTIFICATIONS } from '../mocks/alerts.mock';

function Harness({ value = {} }: { value?: Partial<AlertsContextValue> }) {
  const [isOpen, setOpen] = useState(false);
  return (
    <AlertsContext.Provider
      value={{ ...MOCK_ALERTS_CONTEXT, isOpen, setOpen, ...value }}
    >
      <NotificationBell />
    </AlertsContext.Provider>
  );
}

const MOCK_PAGE = {
  items: MOCK_NOTIFICATIONS,
  total: 23,
  page: 1,
  pageSize: 10,
};

async function openBell() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /^Notificações/ }));
  return user;
}

describe('NotificationBell', () => {
  it.each([null, 0])(
    'hides the badge for count %s and keeps the bell available',
    (count) => {
      render(<Harness value={{ unreadCount: count }} />);
      expect(
        screen.queryByTestId('notification-count')
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^Notificações/ })
      ).toBeEnabled();
    }
  );

  it.each([
    [1, '1', 'não lida'],
    [9, '9', 'não lidas'],
    [10, '9+', 'não lidas'],
    [23, '9+', 'não lidas'],
  ] as const)(
    'renders count %i as %s with the full accessible count',
    (count, badge, suffix) => {
      render(<Harness value={{ unreadCount: count, alerts: MOCK_PAGE }} />);
      expect(screen.getByTestId('notification-count')).toHaveTextContent(badge);
      expect(
        screen.getByRole('button', { name: `Notificações, ${count} ${suffix}` })
      ).toBeEnabled();
    }
  );

  it('opens a named dialog and shows server order, severity, company and due dates', async () => {
    render(<Harness value={{ unreadCount: 23, alerts: MOCK_PAGE }} />);
    await openBell();
    const dialog = screen.getByRole('dialog', { name: 'Notificações' });
    expect(dialog).toHaveAccessibleDescription(
      'Alertas pendentes das suas empresas.'
    );
    const items = within(dialog).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    for (const [index, alert] of MOCK_NOTIFICATIONS.entries()) {
      expect(
        within(items[index]).getByRole('heading', { name: alert.title })
      ).toBeInTheDocument();
      expect(within(items[index]).getByText(alert.message)).toBeInTheDocument();
      expect(
        within(items[index]).getByText(alert.customer.name)
      ).toBeInTheDocument();
    }
    expect(within(items[0]).getByText('Prioridade alta')).toBeInTheDocument();
    expect(within(items[1]).getByText('Prioridade média')).toBeInTheDocument();
    expect(within(items[2]).getByText('Prioridade baixa')).toBeInTheDocument();
    expect(within(items[0]).getByText('Não lida')).toBeInTheDocument();
    expect(within(items[1]).getByText('Lida')).toBeInTheDocument();
    expect(within(items[0]).getByText('10/11/2026')).toHaveAttribute(
      'datetime',
      MOCK_NOTIFICATIONS[0].dueDate
    );
  });

  it('limits the visible list to ten items without changing the count', async () => {
    const items = Array.from({ length: 12 }, (_, index) => ({
      ...MOCK_NOTIFICATIONS[0],
      id: `alert-${index}`,
    }));
    render(
      <Harness value={{ unreadCount: 23, alerts: { ...MOCK_PAGE, items } }} />
    );
    await openBell();
    expect(screen.getAllByRole('listitem')).toHaveLength(10);
    expect(
      screen.getByRole('button', { name: 'Notificações, 23 não lidas' })
    ).toBeInTheDocument();
  });

  it('shows the empty state only after a successful load', async () => {
    const { rerender } = render(
      <Harness value={{ alerts: null, listStatus: 'loading' }} />
    );
    await openBell();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Carregando notificações...'
    );
    expect(
      screen.queryByText('Nenhuma notificação pendente')
    ).not.toBeInTheDocument();
    rerender(<Harness />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Nenhuma notificação pendente'
    );
  });

  it('keeps existing notifications visible during refresh', async () => {
    render(<Harness value={{ alerts: MOCK_PAGE, listStatus: 'loading' }} />);
    await openBell();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Atualizando notificações...'
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('shows separate errors and retries through the shared hook', async () => {
    const refreshAlerts = vi.fn().mockResolvedValue(undefined);
    render(
      <Harness
        value={{
          countError: 'Falha no contador.',
          countStatus: 'error',
          listError: 'Falha na lista.',
          listStatus: 'error',
          alerts: null,
          refreshAlerts,
        }}
      />
    );
    const user = await openBell();
    expect(screen.getByRole('alert')).toHaveTextContent('Falha no contador.');
    expect(screen.getByRole('alert')).toHaveTextContent('Falha na lista.');
    expect(
      screen.queryByText('Nenhuma notificação pendente')
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(refreshAlerts).toHaveBeenCalledOnce();
  });

  it('retains the last known count and list on refresh errors', async () => {
    render(
      <Harness
        value={{
          unreadCount: 3,
          alerts: MOCK_PAGE,
          countError: 'Falha no contador.',
          countStatus: 'error',
          listError: 'Falha na lista.',
          listStatus: 'error',
        }}
      />
    );
    await openBell();
    expect(screen.getByTestId('notification-count')).toHaveTextContent('3');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('disables retry while a request is in progress', async () => {
    render(
      <Harness
        value={{
          countStatus: 'loading',
          listStatus: 'error',
          listError: 'Falha na lista.',
        }}
      />
    );
    await openBell();
    expect(
      screen.getByRole('button', { name: 'Tentar novamente' })
    ).toBeDisabled();
  });

  it('opens with the keyboard, focuses the list and returns focus on Escape', async () => {
    render(<Harness value={{ alerts: MOCK_PAGE }} />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /^Notificações/ });
    await user.tab();
    expect(trigger).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: 'Fechar notificações' })
    ).toHaveFocus();
    await user.tab();
    expect(screen.getAllByRole('article')[0]).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('closes using the close button and outside interaction', async () => {
    render(<Harness />);
    const user = await openBell();
    await user.click(
      screen.getByRole('button', { name: 'Fechar notificações' })
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await openBell();
    await user.click(document.body);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('does not mark or navigate when inspecting an item in this step', async () => {
    const refreshAlerts = vi.fn();
    render(<Harness value={{ alerts: MOCK_PAGE, refreshAlerts }} />);
    const user = await openBell();
    await user.click(screen.getByText('Licença vencida'));
    expect(refreshAlerts).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { expect, it } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { authStorage } from '../../features/auth/authStorage';
import { useAuth } from '../../features/auth/useAuth';
import type { Alert } from '../../features/alerts/types';
import { login } from '../../services/api/authApi';
import {
  getUnreadAlertsCount,
  listAlerts,
  markAlertAsRead,
} from '../../services/api/alertsApi';
import { getLicenseDetails } from '../../services/api/licensesApi';
import { ApiError } from '../../services/api/apiError';

function LocationProbe() {
  return <span data-testid="live-location">{useLocation().pathname}</span>;
}

it('validates real alerts HTTP, tenant isolation and notification navigation', async () => {
  const password = process.env.BIOTA_TEST_PASSWORD;
  expect(
    password,
    'Test password must be supplied only through the process environment'
  ).toBeTruthy();
  const sessions = await Promise.all([
    login({ email: 'admin@biotageom.com.br', password: password! }),
    login({ email: 'carlos.analista@biotageom.com.br', password: password! }),
  ]);
  const snapshots: { count: number; items: Alert[]; first: Alert[] }[] = [];
  const selectSession = (index: number) => {
    const session = sessions[index];
    authStorage.setTokens(session.accessToken, session.refreshToken);
    useAuth.setState({ user: session.user, status: 'authenticated' });
  };
  try {
    for (let index = 0; index < sessions.length; index++) {
      selectSession(index);
      const count = await getUnreadAlertsCount();
      const first = await listAlerts();
      expect(first.page).toBe(1);
      expect(first.pageSize).toBe(10);
      expect(first.items.length).toBeLessThanOrEqual(10);
      let page = await listAlerts({ pageSize: 100 });
      const items = [...page.items];
      while (items.length < page.total) {
        expect(
          page.items.length,
          'Pagination must make progress'
        ).toBeGreaterThan(0);
        page = await listAlerts({ page: page.page + 1, pageSize: 100 });
        items.push(...page.items);
      }
      expect(count).toBe(items.filter((item) => item.status === 'OPEN').length);
      const severity = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      for (let n = 0; n < items.length; n++) {
        const item = items[n];
        expect(['LICENSE_EXPIRATION', 'CONDITION_DUE']).toContain(item.type);
        expect(['OPEN', 'READ']).toContain(item.status);
        expect(['HIGH', 'MEDIUM', 'LOW']).toContain(item.severity);
        expect(typeof item.title).toBe('string');
        expect(typeof item.message).toBe('string');
        expect(item.customer.id).toBeTruthy();
        expect(typeof item.customer.name).toBe('string');
        expect(item.license.id).toBeTruthy();
        expect(typeof item.license.processNumber).toBe('string');
        expect(Number.isNaN(Date.parse(item.dueDate))).toBe(false);
        expect(Number.isNaN(Date.parse(item.createdAt))).toBe(false);
        if (item.type === 'LICENSE_EXPIRATION')
          expect(item.condition).toBeNull();
        else expect(item.condition?.id).toBeTruthy();
        if (n > 0) {
          const previous = items[n - 1];
          expect(severity[item.severity]).toBeGreaterThanOrEqual(
            severity[previous.severity]
          );
          if (item.severity === previous.severity) {
            expect(Date.parse(item.dueDate)).toBeGreaterThanOrEqual(
              Date.parse(previous.dueDate)
            );
          }
        }
      }
      snapshots.push({ count, items, first: first.items });
      console.log(
        JSON.stringify({
          check: 'contract-and-count',
          client: index === 0 ? 'Ana' : 'Carlos',
          unread: count,
          pending: items.length,
          firstPage: first.items.length,
        })
      );
    }
    const anaIds = new Set(snapshots[0].items.map((item) => item.id));
    expect(snapshots[1].items.some((item) => anaIds.has(item.id))).toBe(false);
    for (let owner = 0; owner < sessions.length; owner++) {
      const foreign =
        snapshots[owner].items.find((item) => item.status === 'READ') ??
        snapshots[owner].items[0];
      expect(
        foreign,
        'Each seeded client must have alerts for the isolation test'
      ).toBeDefined();
      selectSession(1 - owner);
      let rejected: unknown;
      try {
        await markAlertAsRead(foreign.id);
      } catch (error) {
        rejected = error;
      }
      expect(rejected).toBeInstanceOf(ApiError);
      expect((rejected as ApiError).status).toBe(404);
    }
    console.log(
      JSON.stringify({
        check: 'tenant-isolation',
        disjointLists: true,
        crossTenantPatch: [404, 404],
      })
    );

    const owner = snapshots.findIndex((snapshot) =>
      snapshot.first.some((item) => item.status === 'OPEN')
    );
    expect(
      owner,
      'At least one first page needs an OPEN seeded alert'
    ).toBeGreaterThanOrEqual(0);
    selectSession(owner);
    const before = await getUnreadAlertsCount();
    const page = await listAlerts();
    const targetIndex = page.items.findIndex((item) => item.status === 'OPEN');
    expect(targetIndex).toBeGreaterThanOrEqual(0);
    const target = page.items[targetIndex];
    const details = await getLicenseDetails(
      target.customer.id,
      target.license.id
    );
    expect(details.id).toBe(target.license.id);

    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/admin/companies']}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    );
    await user.click(
      await screen.findByRole('button', {
        name: `Notificações, ${before} ${before === 1 ? 'não lida' : 'não lidas'}`,
      })
    );
    const dialog = screen.getByRole('dialog', { name: 'Notificações' });
    await waitFor(() =>
      expect(within(dialog).getAllByRole('listitem')).toHaveLength(
        page.items.length
      )
    );
    const row = within(dialog).getAllByRole('listitem')[targetIndex];
    expect(
      within(row).getByRole('button', { name: target.title })
    ).toBeEnabled();
    await user.click(within(row).getByRole('button', { name: target.title }));
    const destination = `/companies/${target.customer.id}/licenses/${target.license.id}`;
    await waitFor(() =>
      expect(screen.getByTestId('live-location')).toHaveTextContent(destination)
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const after = await getUnreadAlertsCount();
    expect(after).toBe(before - 1);
    await screen.findByRole('button', {
      name: `Notificações, ${after} ${after === 1 ? 'não lida' : 'não lidas'}`,
    });
    const readPage = await listAlerts({ status: ['READ'], pageSize: 100 });
    expect(
      readPage.items.some(
        (item) => item.id === target.id && item.status === 'READ'
      )
    ).toBe(true);
    await markAlertAsRead(target.id);
    expect(await getUnreadAlertsCount()).toBe(after);
    console.log(
      JSON.stringify({
        check: 'real-ui-read-and-navigation',
        client: owner === 0 ? 'Ana' : 'Carlos',
        alertId: target.id,
        before,
        after,
        licenseDestinationVerified: true,
        repeatedReadDoesNotDecrement: true,
      })
    );
  } finally {
    cleanup();
    authStorage.clear();
    useAuth.setState({ user: null, status: 'unauthenticated' });
  }
}, 60000);

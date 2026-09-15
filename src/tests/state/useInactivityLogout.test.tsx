import { act, renderHook, screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProtectedRoute } from '../../app/router/ProtectedRoute';
import { APP_ROUTES } from '../../app/router/routes';
import { authStorage } from '../../features/auth/authStorage';
import { useAuth } from '../../features/auth/useAuth';
import {
  INACTIVITY_TIMEOUT_MS,
  useInactivityLogout,
} from '../../features/auth/useInactivityLogout';
import {
  MOCK_AUTH_USER,
  renderWithAuth,
  seedAuthState,
} from '../mocks/renderWithAuth';

/*
 * The whole feature is a clock, so every test here drives vitest's fake timers
 * (which also fake `Date.now()`, the hook's idle reference) instead of waiting
 * on the wall clock.
 */
const MINUTE_MS = 60 * 1000;
const LAST_ACTIVITY_KEY = 'biota.auth.lastActivityAt';

function renderInactivityLogout() {
  return renderHook(() => useInactivityLogout());
}

function advanceBy(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function dispatchActivity(event: Event) {
  act(() => {
    window.dispatchEvent(event);
  });
}

/** A live listener would move the shared clock off the sentinel below. */
function hasLeakedActivityListener() {
  authStorage.setLastActivityAt(0);
  window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
  return authStorage.getLastActivityAt() !== 0;
}

beforeEach(() => {
  vi.useFakeTimers();
  localStorage.clear();
  authStorage.setTokens('access-token', 'refresh-token');
  seedAuthState({ status: 'authenticated', user: MOCK_AUTH_USER });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useInactivityLogout', () => {
  it('keeps the session alive until the predefined period has elapsed', () => {
    renderInactivityLogout();

    advanceBy(INACTIVITY_TIMEOUT_MS - 1);

    expect(useAuth.getState().status).toBe('authenticated');
    expect(useAuth.getState().user).toEqual(MOCK_AUTH_USER);
    expect(authStorage.getAccessToken()).toBe('access-token');
  });

  it('expires the session, clears the tokens and records the reason after the period without activity', () => {
    renderInactivityLogout();

    advanceBy(INACTIVITY_TIMEOUT_MS);

    expect(useAuth.getState().status).toBe('unauthenticated');
    expect(useAuth.getState().user).toBeNull();
    expect(useAuth.getState().sessionEndReason).toBe('inactivity');
    expect(authStorage.getAccessToken()).toBeNull();
    expect(authStorage.getRefreshToken()).toBeNull();
  });

  it('restarts the countdown when the user interacts', () => {
    renderInactivityLogout();

    advanceBy(20 * MINUTE_MS);
    dispatchActivity(new KeyboardEvent('keydown', { key: 'a' }));

    // 40 minutes in total, but only 20 since the keystroke.
    advanceBy(20 * MINUTE_MS);
    expect(useAuth.getState().status).toBe('authenticated');

    advanceBy(10 * MINUTE_MS);
    expect(useAuth.getState().status).toBe('unauthenticated');
    expect(useAuth.getState().sessionEndReason).toBe('inactivity');
  });

  it.each([
    ['keydown', () => new KeyboardEvent('keydown', { key: 'a' })],
    ['mousedown', () => new MouseEvent('mousedown')],
    ['mousemove', () => new MouseEvent('mousemove')],
    ['wheel', () => new Event('wheel')],
    ['touchstart', () => new Event('touchstart')],
    ['scroll', () => new Event('scroll')],
  ])('treats %s as user activity', (_name, createEvent) => {
    renderInactivityLogout();

    advanceBy(INACTIVITY_TIMEOUT_MS - MINUTE_MS);
    dispatchActivity(createEvent());
    advanceBy(2 * MINUTE_MS);

    expect(useAuth.getState().status).toBe('authenticated');
  });

  it('does nothing at all while nobody is authenticated', () => {
    localStorage.clear();
    seedAuthState({ status: 'unauthenticated', user: null });

    renderInactivityLogout();

    // Not even the shared clock is touched: the effect body never runs.
    expect(authStorage.getLastActivityAt()).toBeNull();
    advanceBy(2 * INACTIVITY_TIMEOUT_MS);
    expect(useAuth.getState().sessionEndReason).toBeNull();
  });

  it('stops watching on logout, so a signed-out user is never told the session expired', () => {
    renderInactivityLogout();
    advanceBy(10 * MINUTE_MS);

    act(() => {
      useAuth.getState().logout();
    });

    expect(hasLeakedActivityListener()).toBe(false);
    advanceBy(2 * INACTIVITY_TIMEOUT_MS);
    expect(useAuth.getState().status).toBe('unauthenticated');
    expect(useAuth.getState().sessionEndReason).toBeNull();
  });

  it('drops the timer and the listeners on unmount', () => {
    const { unmount } = renderInactivityLogout();

    unmount();

    expect(hasLeakedActivityListener()).toBe(false);
    // A surviving timer would expire this still-authenticated session.
    advanceBy(2 * INACTIVITY_TIMEOUT_MS);
    expect(useAuth.getState().status).toBe('authenticated');
    expect(useAuth.getState().sessionEndReason).toBeNull();
  });

  it('persists activity to the shared clock at most once every 30 seconds', () => {
    renderInactivityLogout();
    const mountedAt = authStorage.getLastActivityAt();

    advanceBy(10 * 1000);
    dispatchActivity(new KeyboardEvent('keydown', { key: 'a' }));
    expect(authStorage.getLastActivityAt()).toBe(mountedAt);

    advanceBy(31 * 1000);
    dispatchActivity(new KeyboardEvent('keydown', { key: 'a' }));
    expect(authStorage.getLastActivityAt()).toBe(Date.now());
  });

  it('stays signed in while another tab reports activity on the shared clock', () => {
    renderInactivityLogout();

    advanceBy(25 * MINUTE_MS);
    // What a second tab writes while the user works there.
    authStorage.setLastActivityAt(Date.now());

    advanceBy(10 * MINUTE_MS);
    expect(useAuth.getState().status).toBe('authenticated');

    advanceBy(20 * MINUTE_MS);
    expect(useAuth.getState().status).toBe('unauthenticated');
  });

  it('expires right away when the app reopens on an already idle shared clock', () => {
    authStorage.setLastActivityAt(Date.now() - INACTIVITY_TIMEOUT_MS - 1);

    renderInactivityLogout();
    advanceBy(1);

    expect(useAuth.getState().status).toBe('unauthenticated');
    expect(useAuth.getState().sessionEndReason).toBe('inactivity');
  });

  it('ignores a corrupted shared clock instead of expiring on it', () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, 'not-a-timestamp');

    renderInactivityLogout();
    advanceBy(INACTIVITY_TIMEOUT_MS - 1);

    expect(useAuth.getState().status).toBe('authenticated');
  });
});

/*
 * The hook never navigates by itself: it flips the store to 'unauthenticated'
 * and ProtectedRoute — the guard the whole app already routes through — sends
 * the user to /login. This is that path end to end, on a route table small
 * enough to keep the real pages (and their requests) out of it.
 */
function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function GuardedApp() {
  useInactivityLogout();

  return (
    <>
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route
            path={APP_ROUTES.admin.companies}
            element={<span>Painel administrativo</span>}
          />
        </Route>
        <Route path={APP_ROUTES.login} element={<span>Tela de login</span>} />
      </Routes>
      <LocationProbe />
    </>
  );
}

describe('inactivity redirect', () => {
  it('sends the user to /login once the session expires', () => {
    renderWithAuth(<GuardedApp />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
      initialRoute: APP_ROUTES.admin.companies,
    });

    expect(screen.getByText('Painel administrativo')).toBeInTheDocument();

    advanceBy(INACTIVITY_TIMEOUT_MS);

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.login
    );
    expect(useAuth.getState().sessionEndReason).toBe('inactivity');
  });

  it('keeps the user on the page while they are still interacting', () => {
    renderWithAuth(<GuardedApp />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
      initialRoute: APP_ROUTES.admin.companies,
    });

    advanceBy(INACTIVITY_TIMEOUT_MS - MINUTE_MS);
    dispatchActivity(new MouseEvent('mousedown'));
    advanceBy(INACTIVITY_TIMEOUT_MS - MINUTE_MS);

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.admin.companies
    );
    expect(screen.getByText('Painel administrativo')).toBeInTheDocument();
  });
});

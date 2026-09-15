import { useEffect } from 'react';
import { authStorage } from './authStorage';
import { useAuth } from './useAuth';

/**
 * Predefined inactivity period required by US10 ("a sessão expira
 * automaticamente após período predefinido de inatividade"). Thirty minutes is
 * the single source of truth for that period — nothing else in the app should
 * hard-code an idle duration. It is unrelated to the token lifetimes (access
 * token: 15 min, refresh token: 7 days): those bound how long a *credential*
 * stays usable, while this bounds how long an unattended *session* stays open.
 */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Interactions that count as "the user is still there": keyboard, mouse,
 * touch and scrolling. Captured (not bubbled) so an inner handler that stops
 * propagation cannot make the app look idle, and `passive` because none of
 * these listeners ever calls `preventDefault`.
 */
const ACTIVITY_EVENTS = [
  'keydown',
  'mousedown',
  'mousemove',
  'wheel',
  'touchstart',
  'scroll',
] as const;

const LISTENER_OPTIONS = { capture: true, passive: true } as const;

/**
 * How often the shared timestamp is written to localStorage while the user
 * keeps interacting. Writing on every `mousemove` would mean hundreds of
 * storage writes per minute for no gain: a 30 s resolution is already three
 * orders of magnitude finer than the timeout it feeds.
 */
const ACTIVITY_PERSIST_INTERVAL_MS = 30 * 1000;

/**
 * Signs the user out after `timeoutMs` without any interaction, and tells the
 * store why, so the login screen can explain it.
 *
 * Mounted once by `AppRouter` (the app shell, which outlives every route) so
 * navigating does not restart the countdown. It is a no-op while nobody is
 * authenticated, which is also what tears everything down on logout: the
 * status change re-runs the effect, whose cleanup clears the timer and the
 * listeners.
 */
export function useInactivityLogout(
  timeoutMs: number = INACTIVITY_TIMEOUT_MS
): void {
  const status = useAuth((state) => state.status);
  const expireSessionForInactivity = useAuth(
    (state) => state.expireSessionForInactivity
  );

  useEffect(() => {
    if (status !== 'authenticated') return;

    /*
     * Multiple tabs (MVP decision): tabs share one idle clock through
     * `biota.auth.lastActivityAt`, so interacting with any tab keeps all of
     * them alive — the annoying case (a background tab expiring while the user
     * works in another one) simply cannot happen. Each tab still runs its own
     * timer and notices the expiry on its next check; since every tab
     * schedules from the same timestamp they land together, give or take the
     * persistence interval. We deliberately do NOT listen for the `storage`
     * event to force other tabs out at the same millisecond — that extra
     * coordination buys nothing for the MVP.
     *
     * Reading the stored value instead of resetting it also means a session
     * left idle across a reload (or a browser restart) stays expired rather
     * than getting a fresh 30 minutes.
     */
    let lastActivityAt = authStorage.getLastActivityAt() ?? Date.now();
    let lastPersistedAt = lastActivityAt;
    authStorage.setLastActivityAt(lastActivityAt);

    let timerId: ReturnType<typeof setTimeout> | undefined;

    function readLastActivityAt(): number {
      const shared = authStorage.getLastActivityAt();
      return shared !== null && shared > lastActivityAt
        ? shared
        : lastActivityAt;
    }

    function checkIdleTime(): void {
      const idleFor = Date.now() - readLastActivityAt();

      if (idleFor >= timeoutMs) {
        expireSessionForInactivity();
        return;
      }

      // Activity happened since this check was scheduled: wait out the rest.
      timerId = setTimeout(checkIdleTime, timeoutMs - idleFor);
    }

    /*
     * Runs on every mousemove, so it does the cheapest thing that works: it
     * moves a timestamp. No React state (a re-render per mouse move would be
     * absurd) and no timer churn — the pending timer reads the timestamp when
     * it fires and reschedules itself for whatever is left.
     */
    function registerActivity(): void {
      const now = Date.now();
      lastActivityAt = now;

      if (now - lastPersistedAt >= ACTIVITY_PERSIST_INTERVAL_MS) {
        lastPersistedAt = now;
        authStorage.setLastActivityAt(now);
      }
    }

    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, registerActivity, LISTENER_OPTIONS);
    }

    const elapsed = Date.now() - lastActivityAt;
    timerId = setTimeout(checkIdleTime, Math.max(0, timeoutMs - elapsed));

    return () => {
      clearTimeout(timerId);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(
          eventName,
          registerActivity,
          LISTENER_OPTIONS
        );
      }
    };
  }, [expireSessionForInactivity, status, timeoutMs]);
}

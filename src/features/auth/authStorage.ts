const ACCESS_TOKEN_KEY = 'biota.auth.accessToken';
const REFRESH_TOKEN_KEY = 'biota.auth.refreshToken';
/*
 * Shared idle clock for the inactivity timeout (see useInactivityLogout.ts).
 * It lives next to the tokens so that clearing the session clears it too, and
 * so every tab of the app reads and writes the same timestamp.
 */
const LAST_ACTIVITY_KEY = 'biota.auth.lastActivityAt';

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setRefreshToken(token: string): void {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  /** Epoch milliseconds of the last user interaction, or `null` when nothing was ever recorded (or the stored value is not a number). */
  getLastActivityAt(): number | null {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (raw === null) return null;

    const parsed = Number.parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : null;
  },

  setLastActivityAt(timestamp: number): void {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
  },

  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  },
};

import { create } from 'zustand';
import * as authApi from '../../services/api/authApi';
import {
  setSessionRefreshedHandler,
  setUnauthorizedHandler,
} from '../../services/api/http';
import { authStorage } from './authStorage';
import { isTokenExpired } from './authTokens';
import type { AuthStatus, AuthUser, LoginInput, RegisterInput } from './types';

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  /** Silent session restore on app boot. Safe to call more than once — a no-op after the first. */
  bootstrap: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  status: 'idle',

  bootstrap: async () => {
    if (get().status !== 'idle') return;

    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken || isTokenExpired(refreshToken)) {
      authStorage.clear();
      set({ user: null, status: 'unauthenticated' });
      return;
    }

    set({ status: 'loading' });

    try {
      const { user, accessToken } = await authApi.refresh(refreshToken);
      authStorage.setAccessToken(accessToken);
      set({ user, status: 'authenticated' });
    } catch {
      authStorage.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },

  login: async (input) => {
    const session = await authApi.login(input);
    authStorage.setTokens(session.accessToken, session.refreshToken);
    set({ user: session.user, status: 'authenticated' });
  },

  register: async (input) => {
    const session = await authApi.register(input);
    authStorage.setTokens(session.accessToken, session.refreshToken);
    set({ user: session.user, status: 'authenticated' });
  },

  logout: () => {
    authStorage.clear();
    set({ user: null, status: 'unauthenticated' });
  },
}));

/*
 * Wires http.ts's low-level session events to the store. Called explicitly
 * from main.tsx (the app's single true entry point) rather than as a
 * module-load side effect here, so the wiring can't silently go missing if
 * some future code path talks to the API without importing this module first.
 */
export function registerAuthEventHandlers(): void {
  setUnauthorizedHandler(() => {
    useAuth.setState({ user: null, status: 'unauthenticated' });
  });

  /*
   * A silent 401-triggered refresh (as opposed to the boot-time one above,
   * which sets `user` itself) only updates the stored access token in
   * http.ts — without this, a role/permission change made server-side
   * mid-session would stay invisible in the UI until the user logs out and
   * back in, even though the refresh response already carries the new user.
   */
  setSessionRefreshedHandler((user) => {
    useAuth.setState({ user });
  });
}

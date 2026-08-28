import { create } from 'zustand';
import * as authApi from '../../services/api/authApi';
import { setUnauthorizedHandler } from '../../services/api/http';
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

// Wired once, outside React: a refresh that fails permanently (dead/invalid
// refresh token) must drop the app back to unauthenticated even though the
// failure originates deep inside an unrelated fetch call, not a store action.
setUnauthorizedHandler(() => {
  useAuth.setState({ user: null, status: 'unauthenticated' });
});

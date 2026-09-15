export interface AuthUser {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/*
 * Why a session ended without the user asking for it. Only the login screen
 * reads it, to explain the redirect instead of showing a credentials error.
 */
export type SessionEndReason = 'inactivity';

export type AuthStatus =
  'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

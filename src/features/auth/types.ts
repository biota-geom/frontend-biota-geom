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

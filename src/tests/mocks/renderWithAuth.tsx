import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type {
  AuthStatus,
  AuthUser,
  SessionEndReason,
} from '../../features/auth/types';
import { useAuth } from '../../features/auth/useAuth';

export const MOCK_AUTH_USER: AuthUser = {
  id: 'user-1',
  name: 'John Doe',
  email: 'john.doe@biotageom.com.br',
  isActive: true,
  isAdmin: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  lastLoginAt: null,
};

interface SeedAuthStateOptions {
  status?: AuthStatus;
  user?: AuthUser | null;
  sessionEndReason?: SessionEndReason | null;
}

/**
 * Seeds the (module-singleton) auth store directly, bypassing bootstrap —
 * AppRouter's bootstrap effect never runs when a test renders <AppRoutes/> on
 * its own. Every seeded field is always written, `sessionEndReason` included,
 * so a session expired by one test can never leak into the next one.
 */
export function seedAuthState({
  status = 'unauthenticated',
  user = null,
  sessionEndReason = null,
}: SeedAuthStateOptions = {}) {
  useAuth.setState({ status, user, sessionEndReason });
}

interface RenderWithAuthOptions extends SeedAuthStateOptions {
  initialRoute?: string;
}

export function renderWithAuth(
  ui: ReactNode,
  {
    status = 'unauthenticated',
    user = null,
    sessionEndReason = null,
    initialRoute = '/',
  }: RenderWithAuthOptions = {}
) {
  seedAuthState({ status, user, sessionEndReason });

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
  );
}

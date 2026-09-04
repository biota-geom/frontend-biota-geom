import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import type { AuthStatus, AuthUser } from '../../features/auth/types';
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
}

/** Seeds the (module-singleton) auth store directly, bypassing bootstrap — AppRouter's bootstrap effect never runs when a test renders <AppRoutes/> on its own. */
export function seedAuthState({
  status = 'unauthenticated',
  user = null,
}: SeedAuthStateOptions = {}) {
  useAuth.setState({ status, user });
}

interface RenderWithAuthOptions extends SeedAuthStateOptions {
  initialRoute?: string;
}

export function renderWithAuth(
  ui: ReactNode,
  {
    status = 'unauthenticated',
    user = null,
    initialRoute = '/',
  }: RenderWithAuthOptions = {}
) {
  seedAuthState({ status, user });

  return render(
    <MemoryRouter initialEntries={[initialRoute]}>{ui}</MemoryRouter>
  );
}

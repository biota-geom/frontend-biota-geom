import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RootRedirect } from '../../app/router/AppRouter';
import { APP_ROUTES } from '../../app/router/routes';
import { MOCK_AUTH_USER, seedAuthState } from '../mocks/renderWithAuth';

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

/*
 * RootRedirect is mounted on its own here rather than through <AppRoutes/>: in
 * the full route table PublicOnlyRoute and ProtectedRoute read the same status
 * and would silently fix up a wrong redirect, hiding the bug being tested.
 */
function renderRoot(options: Parameters<typeof seedAuthState>[0]) {
  seedAuthState(options);

  return render(
    <MemoryRouter initialEntries={[APP_ROUTES.root]}>
      <Routes>
        <Route path={APP_ROUTES.root} element={<RootRedirect />} />
        <Route path={APP_ROUTES.login} element={<LocationProbe />} />
        <Route path={APP_ROUTES.admin.companies} element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RootRedirect', () => {
  it.each(['idle', 'loading'] as const)(
    'shows a loader while status is %s',
    (status) => {
      renderRoot({ status });

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByTestId('current-path')).not.toBeInTheDocument();
    }
  );

  it('redirects to the admin area when authenticated', () => {
    renderRoot({ status: 'authenticated', user: MOCK_AUTH_USER });

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.admin.companies
    );
  });

  it('redirects to /login when unauthenticated', () => {
    renderRoot({ status: 'unauthenticated' });

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.login
    );
  });
});

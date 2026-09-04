import { render, screen, waitFor } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRouter, AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';
import { useAuth } from '../../features/auth/useAuth';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes(
  initialRoute: string,
  options: Parameters<typeof renderWithAuth>[1] = {}
) {
  return renderWithAuth(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { status: 'unauthenticated', initialRoute, ...options }
  );
}

describe('AppRoutes', () => {
  it('redirects the root path to login', () => {
    renderAppRoutes(APP_ROUTES.root);

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.login
    );
  });

  it('redirects unknown paths to login', () => {
    renderAppRoutes('/this-route-does-not-exist');

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.login
    );
  });

  it('redirects a company root to that company dashboard', () => {
    renderAppRoutes('/companies/unidade-industrial-rs', {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
    });

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      buildCompanyRoutes.dashboard('unidade-industrial-rs')
    );
  });
});

describe('AppRouter', () => {
  it('triggers bootstrap on mount and resolves to the login screen with no stored session', async () => {
    // Every other test renders `AppRoutes` inside a `MemoryRouter` so the
    // starting path is controllable. This one exercises the actual exported
    // `AppRouter` (with `BrowserRouter`) and its bootstrap effect.
    useAuth.setState({ status: 'idle', user: null });

    render(<AppRouter />);

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { name: /biotageom/i })
      ).toBeInTheDocument();
    });
    expect(useAuth.getState().status).toBe('unauthenticated');
  });
});

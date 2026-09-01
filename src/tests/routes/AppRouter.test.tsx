import { render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRouter, AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes(initialRoute: string) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>
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
    renderAppRoutes('/companies/unidade-industrial-rs');

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      buildCompanyRoutes.dashboard('unidade-industrial-rs')
    );
  });

  it('renders the login screen through the real BrowserRouter', () => {
    // Every other test renders `AppRoutes` inside a `MemoryRouter` so the
    // starting path is controllable. This one exercises the actual exported
    // `AppRouter` (with `BrowserRouter`), which nothing else does.
    render(<AppRouter />);

    expect(
      screen.getByRole('heading', { name: /biotageom/i })
    ).toBeInTheDocument();
  });
});

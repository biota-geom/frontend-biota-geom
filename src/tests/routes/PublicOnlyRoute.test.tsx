import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PublicOnlyRoute } from '../../app/router/PublicOnlyRoute';
import {
  MOCK_AUTH_USER,
  renderWithAuth,
  seedAuthState,
} from '../mocks/renderWithAuth';

function LocationProbe() {
  const location = useLocation();

  return (
    <span data-testid="current-url">
      {location.pathname}
      {location.search}
      {location.hash}
    </span>
  );
}

/** Mimics ProtectedRoute handing back the location it bounced away from. */
function renderRestoringFrom(from: unknown) {
  seedAuthState({ status: 'authenticated', user: MOCK_AUTH_USER });

  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state: { from } }]}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<p>Tela de login</p>} />
        </Route>
        <Route path="/admin/companies" element={<p>Empresas</p>} />
        <Route
          path="/companies/:companyId/licenses"
          element={<LocationProbe />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function renderPublicOnly(options: Parameters<typeof renderWithAuth>[1]) {
  return renderWithAuth(
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<p>Tela de login</p>} />
      </Route>
      <Route path="/admin/companies" element={<p>Empresas</p>} />
    </Routes>,
    { initialRoute: '/login', ...options }
  );
}

describe('PublicOnlyRoute', () => {
  it.each(['idle', 'loading'] as const)(
    'shows a loader instead of redirecting while status is %s',
    (status) => {
      renderPublicOnly({ status });

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
    }
  );

  it('renders the public content when unauthenticated', () => {
    renderPublicOnly({ status: 'unauthenticated' });

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('redirects to the admin area when already authenticated', () => {
    renderPublicOnly({ status: 'authenticated', user: MOCK_AUTH_USER });

    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
  });

  it('restores the whole deep link, query string and hash included', () => {
    renderRestoringFrom({
      pathname: '/companies/unidade-industrial-rs/licenses',
      search: '?status=vencida',
      hash: '#licenca-1',
    });

    expect(screen.getByTestId('current-url')).toHaveTextContent(
      '/companies/unidade-industrial-rs/licenses?status=vencida#licenca-1'
    );
  });

  it('restores a bare pathname without inventing a query string or hash', () => {
    renderRestoringFrom({
      pathname: '/companies/unidade-industrial-rs/licenses',
    });

    expect(screen.getByTestId('current-url')).toHaveTextContent(
      '/companies/unidade-industrial-rs/licenses'
    );
    expect(screen.getByTestId('current-url').textContent).toBe(
      '/companies/unidade-industrial-rs/licenses'
    );
  });
});

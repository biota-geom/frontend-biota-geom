import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { PublicOnlyRoute } from '../../app/router/PublicOnlyRoute';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

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
  it('shows a loader instead of redirecting while status is idle or loading', () => {
    renderPublicOnly({ status: 'loading' });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
  });

  it('renders the public content when unauthenticated', () => {
    renderPublicOnly({ status: 'unauthenticated' });

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('redirects to the admin area when already authenticated', () => {
    renderPublicOnly({ status: 'authenticated', user: MOCK_AUTH_USER });

    expect(screen.getByText('Empresas')).toBeInTheDocument();
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
  });
});

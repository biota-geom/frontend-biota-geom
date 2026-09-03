import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from '../../app/router/ProtectedRoute';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

function SecretPage() {
  return <p>Conteúdo protegido</p>;
}

function renderProtected(options: Parameters<typeof renderWithAuth>[1]) {
  return renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<SecretPage />} />
      </Route>
      <Route path="/login" element={<p>Tela de login</p>} />
    </Routes>,
    { initialRoute: '/secret', ...options }
  );
}

describe('ProtectedRoute', () => {
  it('shows a loader instead of redirecting while status is idle or loading', () => {
    renderProtected({ status: 'idle' });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('Tela de login')).not.toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    renderProtected({ status: 'unauthenticated' });

    expect(screen.getByText('Tela de login')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    renderProtected({ status: 'authenticated', user: MOCK_AUTH_USER });

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});

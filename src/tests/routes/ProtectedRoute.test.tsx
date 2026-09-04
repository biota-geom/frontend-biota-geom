import { screen } from '@testing-library/react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ProtectedRoute } from '../../app/router/ProtectedRoute';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

function SecretPage() {
  return <p>Conteúdo protegido</p>;
}

function LoginProbe() {
  const location = useLocation();
  const state = location.state as { from?: { pathname: string } } | null;

  return <p>Tela de login para {state?.from?.pathname ?? 'nenhuma rota'}</p>;
}

function renderProtected(options: Parameters<typeof renderWithAuth>[1]) {
  return renderWithAuth(
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/secret" element={<SecretPage />} />
      </Route>
      <Route path="/login" element={<LoginProbe />} />
    </Routes>,
    { initialRoute: '/secret', ...options }
  );
}

describe('ProtectedRoute', () => {
  it('shows a loader instead of redirecting while status is idle or loading', () => {
    renderProtected({ status: 'idle' });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/tela de login/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Conteúdo protegido')).not.toBeInTheDocument();
  });

  it('shows a loader instead of redirecting while a session is being restored', () => {
    renderProtected({ status: 'loading' });

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText(/tela de login/i)).not.toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated, remembering the attempted route', () => {
    renderProtected({ status: 'unauthenticated' });

    expect(screen.getByText('Tela de login para /secret')).toBeInTheDocument();
  });

  it('renders the protected content when authenticated', () => {
    renderProtected({ status: 'authenticated', user: MOCK_AUTH_USER });

    expect(screen.getByText('Conteúdo protegido')).toBeInTheDocument();
  });
});

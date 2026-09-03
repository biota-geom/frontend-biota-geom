import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

function renderRoot(options: Parameters<typeof renderWithAuth>[1]) {
  return renderWithAuth(<AppRoutes />, { initialRoute: '/', ...options });
}

describe('RootRedirect', () => {
  it('shows a loader while status is idle or loading', () => {
    renderRoot({ status: 'idle' });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to the admin area when authenticated', () => {
    renderRoot({ status: 'authenticated', user: MOCK_AUTH_USER });

    expect(
      screen.getByRole('heading', { name: /empresas cadastradas/i })
    ).toBeInTheDocument();
  });

  it('redirects to /login when unauthenticated', () => {
    renderRoot({ status: 'unauthenticated' });

    expect(
      screen.getByRole('heading', { name: /biotageom/i })
    ).toBeInTheDocument();
  });
});

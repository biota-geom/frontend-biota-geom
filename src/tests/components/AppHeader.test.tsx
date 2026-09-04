import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { AppHeader } from '../../components/layout/AppHeader';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

describe('AppHeader', () => {
  it('shows initials derived from the authenticated user name', () => {
    renderWithAuth(<AppHeader navItems={[]} />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
    });

    expect(screen.getByLabelText(MOCK_AUTH_USER.name).textContent).toBe('JD');
  });

  it('keeps only the first and last initial of a longer name', () => {
    renderWithAuth(<AppHeader navItems={[]} />, {
      status: 'authenticated',
      user: { ...MOCK_AUTH_USER, name: 'Ana Maria Silva' },
    });

    expect(screen.getByLabelText('Ana Maria Silva').textContent).toBe('AS');
  });

  it('ignores stray whitespace around the name', () => {
    renderWithAuth(<AppHeader navItems={[]} />, {
      status: 'authenticated',
      user: { ...MOCK_AUTH_USER, name: '  Ana Maria Silva  ' },
    });

    expect(screen.getByLabelText('Ana Maria Silva').textContent).toBe('AS');
  });

  it('derives a single initial from a one-word name', () => {
    renderWithAuth(<AppHeader navItems={[]} />, {
      status: 'authenticated',
      user: { ...MOCK_AUTH_USER, name: 'Madonna' },
    });

    expect(screen.getByLabelText('Madonna').textContent).toBe('M');
  });

  it('falls back to a generic badge when no user is loaded yet', () => {
    renderWithAuth(<AppHeader navItems={[]} />, { status: 'unauthenticated' });

    expect(screen.getByLabelText('Usuário administrador').textContent).toBe(
      'US'
    );
  });

  it('clears the session when "Sair" is clicked', async () => {
    const user = userEvent.setup();
    renderWithAuth(<AppHeader navItems={[]} />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
    });

    await user.click(screen.getByRole('button', { name: /sair/i }));

    const { useAuth } = await import('../../features/auth/useAuth');
    expect(useAuth.getState().status).toBe('unauthenticated');
    expect(useAuth.getState().user).toBeNull();
  });
});

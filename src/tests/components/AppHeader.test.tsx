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

    expect(screen.getByLabelText(MOCK_AUTH_USER.name)).toHaveTextContent('JD');
  });

  it('derives a single initial from a one-word name', () => {
    renderWithAuth(<AppHeader navItems={[]} />, {
      status: 'authenticated',
      user: { ...MOCK_AUTH_USER, name: 'Madonna' },
    });

    expect(screen.getByLabelText('Madonna')).toHaveTextContent('M');
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

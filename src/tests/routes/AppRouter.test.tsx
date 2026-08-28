import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRouter } from '../../app/router/AppRouter';
import { useAuth } from '../../features/auth/useAuth';

describe('AppRouter', () => {
  it('triggers bootstrap on mount and resolves to the login screen with no stored session', async () => {
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

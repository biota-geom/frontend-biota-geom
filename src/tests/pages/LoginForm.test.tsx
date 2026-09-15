import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_MESSAGES } from '../../features/auth/authMessages';
import { useAuth } from '../../features/auth/useAuth';
import { LoginForm } from '../../pages/Login/components/LoginForm';
import { seedAuthState } from '../mocks/renderWithAuth';

/*
 * Registered before the static imports run (vi.mock is hoisted), so the store
 * this file drives never reaches the network. See AGENTS.md on why this must
 * live in the test file itself and never in a shared setup script.
 */
vi.mock('../../services/api/authApi', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
}));

const authApi = await import('../../services/api/authApi');

/*
 * Submission (login call, error message, disabled button) is covered end to end
 * in LoginPage.test.tsx. This file stays on the pieces LoginForm owns on its
 * own: the password visibility toggle and the "Esqueceu a senha?" no-op.
 */
function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  seedAuthState({ status: 'unauthenticated', user: null });
});

describe('LoginForm', () => {
  it('starts with the password hidden', () => {
    renderLoginForm();

    expect(screen.getByLabelText(/senha de acesso/i)).toHaveAttribute(
      'type',
      'password'
    );
    expect(
      screen.getByRole('button', { name: /exibir senha/i })
    ).toHaveAttribute('aria-pressed', 'false');
  });

  it('reveals the password when the toggle button is clicked', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    await user.click(screen.getByRole('button', { name: /exibir senha/i }));

    expect(screen.getByLabelText(/senha de acesso/i)).toHaveAttribute(
      'type',
      'text'
    );
    expect(
      screen.getByRole('button', { name: /ocultar senha/i })
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides the password again on a second click', async () => {
    const user = userEvent.setup();
    renderLoginForm();

    const toggle = screen.getByRole('button', { name: /exibir senha/i });
    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /ocultar senha/i }));

    expect(screen.getByLabelText(/senha de acesso/i)).toHaveAttribute(
      'type',
      'password'
    );
  });

  it('prevents the default browser navigation on "Esqueceu a senha?"', () => {
    renderLoginForm();

    const link = screen.getByRole('link', { name: /esqueceu a senha/i });

    expect(fireEvent.click(link)).toBe(false);
  });
});

describe('LoginForm session notice', () => {
  it('stays quiet when the user simply opened the login screen', () => {
    renderLoginForm();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('explains an inactivity expiry instead of blaming the credentials', () => {
    seedAuthState({ sessionEndReason: 'inactivity' });

    renderLoginForm();

    expect(screen.getByRole('alert')).toHaveTextContent(
      AUTH_MESSAGES.SESSION_EXPIRED_BY_INACTIVITY
    );
    expect(screen.queryByText(/credenciais/i)).not.toBeInTheDocument();
  });

  it('drops the notice as soon as the user tries to sign in again', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(new Error('offline'));
    seedAuthState({ sessionEndReason: 'inactivity' });
    renderLoginForm();

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@empresa.com');
    await user.type(screen.getByLabelText(/senha de acesso/i), 'Senha@1234');
    await user.click(
      screen.getByRole('button', { name: /entrar na plataforma/i })
    );

    expect(useAuth.getState().sessionEndReason).toBeNull();
    expect(screen.getByRole('alert')).toHaveTextContent(
      AUTH_MESSAGES.GENERIC_ERROR
    );
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LoginForm } from '../../pages/Login/components/LoginForm';

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

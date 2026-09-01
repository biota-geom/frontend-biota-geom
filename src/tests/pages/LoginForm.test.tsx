import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { LoginForm } from '../../pages/Login/components/LoginForm';

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

  it('prevents the default browser submission when the form is submitted', () => {
    renderLoginForm();

    const form = screen
      .getByRole('button', { name: /entrar na plataforma/i })
      .closest('form');

    expect(form).not.toBeNull();
    expect(fireEvent.submit(form as HTMLFormElement)).toBe(false);
  });

  it('prevents the default browser navigation on "Esqueceu a senha?"', () => {
    renderLoginForm();

    const link = screen.getByRole('link', { name: /esqueceu a senha/i });

    expect(fireEvent.click(link)).toBe(false);
  });
});

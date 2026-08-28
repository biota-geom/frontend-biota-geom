import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES } from '../../app/router/routes';
import { ApiError } from '../../services/api/apiError';
import { renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/authApi', () => ({
  register: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
}));

const authApi = await import('../../services/api/authApi');

const VALID_SESSION = {
  user: {
    id: 'user-1',
    name: 'John Doe',
    email: 'john.doe@biotageom.com.br',
    isActive: true,
    isAdmin: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    lastLoginAt: null,
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderRegisterPage() {
  return renderWithAuth(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { status: 'unauthenticated', initialRoute: APP_ROUTES.register }
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/nome completo/i), 'John Doe');
  await user.type(
    screen.getByLabelText(/e-mail corporativo/i),
    'john.doe@biotageom.com.br'
  );
  await user.type(screen.getByLabelText(/^senha de acesso$/i), 'Sup3r$ecret!');
  await user.type(screen.getByLabelText(/confirmar senha/i), 'Sup3r$ecret!');
}

describe('RegisterPage', () => {
  it('renders all four fields and a link back to login', () => {
    renderRegisterPage();

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha de acesso$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^entrar$/i })).toBeInTheDocument();
  });

  it('toggles password visibility for both password fields', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    const passwordInput = screen.getByLabelText(/^senha de acesso$/i);
    const confirmationInput = screen.getByLabelText(/confirmar senha/i);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(confirmationInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /exibir senha/i }));

    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(confirmationInput).toHaveAttribute('type', 'text');
  });

  it('never mentions the allowed email domain in any client-side copy', () => {
    renderRegisterPage();

    expect(document.body.textContent?.toLowerCase()).not.toContain(
      'biotageom.com.br'
    );
  });

  it('blocks submission with a weak password and shows the generic message', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome completo/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/e-mail corporativo/i),
      'john.doe@biotageom.com.br'
    );
    await user.type(screen.getByLabelText(/^senha de acesso$/i), 'weak');
    await user.type(screen.getByLabelText(/confirmar senha/i), 'weak');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText(
        'A senha não atende aos requisitos mínimos de segurança.'
      )
    ).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('blocks submission when the confirmation does not match', async () => {
    const user = userEvent.setup();
    renderRegisterPage();

    await user.type(screen.getByLabelText(/nome completo/i), 'John Doe');
    await user.type(
      screen.getByLabelText(/e-mail corporativo/i),
      'john.doe@biotageom.com.br'
    );
    await user.type(
      screen.getByLabelText(/^senha de acesso$/i),
      'Sup3r$ecret!'
    );
    await user.type(screen.getByLabelText(/confirmar senha/i), 'Different1!');
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText('A confirmação de senha não confere.')
    ).toBeInTheDocument();
    expect(authApi.register).not.toHaveBeenCalled();
  });

  it('registers and redirects to the admin area on success', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockResolvedValue(VALID_SESSION);

    renderRegisterPage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(authApi.register).toHaveBeenCalledWith({
      name: 'John Doe',
      email: 'john.doe@biotageom.com.br',
      password: 'Sup3r$ecret!',
      passwordConfirmation: 'Sup3r$ecret!',
    });
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent(
        APP_ROUTES.admin.companies
      )
    );
  });

  it('renders the exact PT-BR message from a rejected registration', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.register).mockRejectedValue(
      new ApiError(403, 'Não foi possível autorizar este cadastro.')
    );

    renderRegisterPage();
    await fillValidForm(user);
    await user.click(screen.getByRole('button', { name: /criar conta/i }));

    expect(
      await screen.findByText('Não foi possível autorizar este cadastro.')
    ).toBeInTheDocument();
  });
});

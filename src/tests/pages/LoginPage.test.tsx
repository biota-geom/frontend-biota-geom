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

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes() {
  return renderWithAuth(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { status: 'unauthenticated', initialRoute: APP_ROUTES.login }
  );
}

describe('LoginPage', () => {
  it('renders the login screen', () => {
    renderAppRoutes();

    expect(
      screen.getByRole('heading', { name: /biotageom/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail corporativo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha de acesso/i)).toBeInTheDocument();
    expect(screen.getByText(/esqueceu a senha/i)).toBeInTheDocument();
  });

  it('toggles password visibility and no-ops on "Esqueceu a senha?"', async () => {
    const user = userEvent.setup();
    renderAppRoutes();

    const passwordInput = screen.getByLabelText(/senha de acesso/i);
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: /exibir senha/i }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByText(/esqueceu a senha/i));
    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.login
    );
  });

  it('renders the platform entry button and a link to register', () => {
    renderAppRoutes();

    expect(
      screen.getByRole('button', { name: /entrar na plataforma/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /cadastre-se/i })
    ).toBeInTheDocument();
  });

  it('logs in with valid credentials and redirects to the admin area', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockResolvedValue({
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
    });

    renderAppRoutes();

    await user.type(
      screen.getByLabelText(/e-mail corporativo/i),
      'john.doe@biotageom.com.br'
    );
    await user.type(screen.getByLabelText(/senha de acesso/i), 'Sup3r$ecret!');
    await user.click(
      screen.getByRole('button', { name: /entrar na plataforma/i })
    );

    expect(authApi.login).toHaveBeenCalledWith({
      email: 'john.doe@biotageom.com.br',
      password: 'Sup3r$ecret!',
    });
    await waitFor(() =>
      expect(screen.getByTestId('current-path')).toHaveTextContent(
        APP_ROUTES.admin.companies
      )
    );
  });

  it('renders the exact PT-BR message from a failed login', async () => {
    const user = userEvent.setup();
    vi.mocked(authApi.login).mockRejectedValue(
      new ApiError(401, 'As credenciais inseridas não foram encontradas.')
    );

    renderAppRoutes();

    await user.type(
      screen.getByLabelText(/e-mail corporativo/i),
      'john.doe@biotageom.com.br'
    );
    await user.type(
      screen.getByLabelText(/senha de acesso/i),
      'wrong-password'
    );
    await user.click(
      screen.getByRole('button', { name: /entrar na plataforma/i })
    );

    expect(
      await screen.findByText('As credenciais inseridas não foram encontradas.')
    ).toBeInTheDocument();
    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.login
    );
  });

  it('disables the submit button while the request is in flight', async () => {
    const user = userEvent.setup();
    let resolveLogin!: (
      value: Awaited<ReturnType<typeof authApi.login>>
    ) => void;
    vi.mocked(authApi.login).mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      })
    );

    renderAppRoutes();

    await user.type(
      screen.getByLabelText(/e-mail corporativo/i),
      'john.doe@biotageom.com.br'
    );
    await user.type(screen.getByLabelText(/senha de acesso/i), 'Sup3r$ecret!');
    await user.click(
      screen.getByRole('button', { name: /entrar na plataforma/i })
    );

    expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();

    resolveLogin({
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
    });
  });
});

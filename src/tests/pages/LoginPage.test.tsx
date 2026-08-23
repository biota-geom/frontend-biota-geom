import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../app/router/AppRouter'
import { APP_ROUTES } from '../../app/router/routes'

function LocationProbe() {
  const location = useLocation()

  return <span data-testid="current-path">{location.pathname}</span>
}

function renderAppRoutes(initialRoute = APP_ROUTES.login) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>,
  )
}

describe('LoginPage', () => {
  it('renders the login screen', () => {
    renderAppRoutes()

    expect(
      screen.getByRole('heading', { name: /biotageom/i }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail corporativo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/senha de acesso/i)).toBeInTheDocument()
    expect(screen.getByText(/esqueceu a senha/i)).toBeInTheDocument()
  })

  it('renders the platform entry button', () => {
    renderAppRoutes()

    expect(
      screen.getByRole('button', { name: /entrar na plataforma/i }),
    ).toBeInTheDocument()
  })

  it('navigates to admin companies without requiring credentials', async () => {
    const user = userEvent.setup()

    renderAppRoutes()

    await user.click(
      screen.getByRole('button', { name: /entrar na plataforma/i }),
    )

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      APP_ROUTES.admin.companies,
    )
  })
})

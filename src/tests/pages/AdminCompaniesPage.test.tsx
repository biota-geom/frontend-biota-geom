import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes(initialRoute = APP_ROUTES.admin.companies) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <AppRoutes />
      <LocationProbe />
    </MemoryRouter>
  );
}

describe('AdminCompaniesPage', () => {
  it('renders company cards without a settings navigation tab', () => {
    renderAppRoutes();

    expect(
      screen.getByRole('heading', { name: /empresas cadastradas/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('article', { name: /unidade industrial rs/i })
    ).toBeInTheDocument();
    expect(screen.getAllByText(/atenção/i)).toHaveLength(6);
    expect(screen.getAllByText(/vencido/i)).toHaveLength(6);
    expect(screen.queryByText(/alertas/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: /configurações/i })
    ).not.toBeInTheDocument();
  });

  it('navigates from a company card to the company dashboard', async () => {
    const user = userEvent.setup();
    renderAppRoutes();

    const companyCard = screen.getByRole('article', {
      name: /unidade industrial rs/i,
    });

    await user.click(
      within(companyCard).getByRole('link', { name: /ver detalhes/i })
    );

    expect(screen.getByTestId('current-path')).toHaveTextContent(
      buildCompanyRoutes.dashboard('unidade-industrial-rs')
    );
  });
});

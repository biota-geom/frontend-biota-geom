import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { APP_ROUTES, buildCompanyRoutes } from '../../app/router/routes';
import {
  getComplianceTone,
  getStatusLabel,
} from '../../pages/admin/Companies/companyCardFormatting';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

function LocationProbe() {
  const location = useLocation();

  return <span data-testid="current-path">{location.pathname}</span>;
}

function renderAppRoutes(initialRoute = APP_ROUTES.admin.companies) {
  return renderWithAuth(
    <>
      <AppRoutes />
      <LocationProbe />
    </>,
    { status: 'authenticated', user: MOCK_AUTH_USER, initialRoute }
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

  it('renders the admin navigation with the current section highlighted', () => {
    renderAppRoutes();

    const companiesLink = screen.getByRole('link', { name: 'Empresas' });
    const legislationLink = screen.getByRole('link', { name: 'Legislação' });
    const indicatorsLink = screen.getByRole('link', { name: 'Indicadores' });

    expect(companiesLink).toHaveAttribute('href', APP_ROUTES.admin.companies);
    expect(legislationLink).toHaveAttribute(
      'href',
      APP_ROUTES.admin.legislation
    );
    expect(indicatorsLink).toHaveAttribute('href', APP_ROUTES.admin.indicators);
    expect(companiesLink.className).toContain('border-primary-strong');
    expect(legislationLink.className).not.toContain('border-primary-strong');
  });

  it('renders the "Nova Empresa" action button', () => {
    renderAppRoutes();

    expect(
      screen.getByRole('button', { name: /nova empresa/i })
    ).toBeInTheDocument();
  });

  it('shows edit and delete controls scoped to each company', () => {
    renderAppRoutes();

    const companyCard = screen.getByRole('article', {
      name: /unidade industrial rs/i,
    });

    expect(
      within(companyCard).getByRole('button', {
        name: /editar unidade industrial rs/i,
      })
    ).toBeInTheDocument();
    expect(
      within(companyCard).getByRole('button', {
        name: /excluir unidade industrial rs/i,
      })
    ).toBeInTheDocument();
  });

  it('labels active and inactive companies with the matching status badge', () => {
    renderAppRoutes();

    const activeCard = screen.getByRole('article', {
      name: /unidade industrial rs/i,
    });
    const inactiveCard = screen.getByRole('article', {
      name: /agro centro-oeste/i,
    });

    const activeBadge = within(activeCard).getByText('Ativo');
    const inactiveBadge = within(inactiveCard).getByText('Inativo');

    expect(activeBadge.className).toContain('text-primary-strong');
    expect(inactiveBadge.className).toContain('text-amber-600');
  });

  it.each([
    { compliance: 100, company: /unidade industrial rs/i, tone: 'primary' },
    { compliance: 90, company: /agro centro-oeste/i, tone: 'primary' },
    { compliance: 85, company: /fábrica são paulo/i, tone: 'amber' },
    { compliance: 50, company: /mineração norte/i, tone: 'red' },
  ])(
    'colors compliance $compliance% as $tone',
    ({ company, compliance, tone }) => {
      renderAppRoutes();

      const card = screen.getByRole('article', { name: company });
      const complianceValue = within(card).getByText(`${compliance}%`);
      const complianceMetric = complianceValue.closest('dd');

      expect(complianceMetric).not.toBeNull();

      const expectedClass =
        tone === 'primary'
          ? '!text-primary-strong'
          : tone === 'amber'
            ? '!text-amber-500'
            : '!text-red-500';

      expect(complianceMetric?.className).toContain(expectedClass);
    }
  );

  it('colors the attention and overdue counts red only when above zero', () => {
    renderAppRoutes();

    const clearCard = screen.getByRole('article', {
      name: /unidade industrial rs/i,
    });
    const flaggedCard = screen.getByRole('article', {
      name: /mineração norte/i,
    });

    const clearAttention = within(clearCard).getByText('Atenção')
      .nextElementSibling as HTMLElement;
    const flaggedAttention = within(flaggedCard).getByText('Atenção')
      .nextElementSibling as HTMLElement;
    const clearOverdue = within(clearCard).getByText('Vencido')
      .nextElementSibling as HTMLElement;
    const flaggedOverdue = within(flaggedCard).getByText('Vencido')
      .nextElementSibling as HTMLElement;

    expect(clearAttention.className).toContain('!text-primary-strong');
    expect(flaggedAttention.className).toContain('!text-amber-500');
    expect(clearOverdue.className).toContain('!text-primary-strong');
    expect(flaggedOverdue.className).toContain('!text-red-500');
  });
});

describe('getComplianceTone', () => {
  it.each([
    { compliance: 100, expected: '!text-primary-strong' },
    { compliance: 90, expected: '!text-primary-strong' },
    { compliance: 89, expected: '!text-amber-500' },
    { compliance: 70, expected: '!text-amber-500' },
    { compliance: 69, expected: '!text-red-500' },
    { compliance: 0, expected: '!text-red-500' },
  ])('returns $expected for $compliance%', ({ compliance, expected }) => {
    expect(getComplianceTone(compliance)).toBe(expected);
  });
});

describe('getStatusLabel', () => {
  it('returns "Ativo" for an active company', () => {
    expect(getStatusLabel('active')).toBe('Ativo');
  });

  it('returns "Inativo" for an inactive company', () => {
    expect(getStatusLabel('inactive')).toBe('Inativo');
  });
});

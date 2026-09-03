import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '../../app/router/AppRouter';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

function renderAppRoutes(initialRoute: string) {
  return renderWithAuth(<AppRoutes />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
    initialRoute,
  });
}

describe('CompanyLayout', () => {
  it('shows the company name as the header context label', () => {
    renderAppRoutes('/companies/unidade-industrial-rs/dashboard');

    const contextButton = screen.getByRole('button', {
      name: /empresa em contexto/i,
    });

    expect(contextButton).toHaveTextContent('Unidade Industrial RS');
  });

  it('falls back to a generic label when the company id is unknown', () => {
    renderAppRoutes('/companies/empresa-desconhecida/dashboard');

    const contextButton = screen.getByRole('button', {
      name: /empresa em contexto/i,
    });

    expect(contextButton).toHaveTextContent('Empresa em contexto');
  });

  it('renders the company navigation with links scoped to that company', () => {
    renderAppRoutes('/companies/unidade-industrial-rs/dashboard');

    expect(screen.getByRole('link', { name: 'Licenças' })).toHaveAttribute(
      'href',
      '/companies/unidade-industrial-rs/licenses'
    );
    expect(screen.getByRole('link', { name: 'Obrigações' })).toHaveAttribute(
      'href',
      '/companies/unidade-industrial-rs/obligations'
    );
    expect(screen.getByRole('link', { name: 'Legislação' })).toHaveAttribute(
      'href',
      '/companies/unidade-industrial-rs/legislation'
    );
    expect(screen.getByRole('link', { name: 'ESG' })).toHaveAttribute(
      'href',
      '/companies/unidade-industrial-rs/indicators'
    );
    expect(screen.getByRole('link', { name: 'Documentos' })).toHaveAttribute(
      'href',
      '/companies/unidade-industrial-rs/documents'
    );
  });

  it('highlights the active company navigation link', () => {
    renderAppRoutes('/companies/unidade-industrial-rs/dashboard');

    const activeLink = screen.getByRole('link', { name: 'Painel' });
    const inactiveLink = screen.getByRole('link', { name: 'Licenças' });

    expect(activeLink.className).toContain('border-primary-strong');
    expect(inactiveLink.className).not.toContain('border-primary-strong');
  });
});

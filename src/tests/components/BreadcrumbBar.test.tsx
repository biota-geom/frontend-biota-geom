import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BreadcrumbBar } from '../../components/layout/BreadcrumbBar';

describe('BreadcrumbBar', () => {
  it('renders every item except the last one as a link', () => {
    render(
      <MemoryRouter>
        <BreadcrumbBar
          items={[
            { label: 'Empresas', to: '/admin/companies' },
            { label: 'Unidade RS', to: '/companies/unidade-rs/dashboard' },
            { label: 'Documentos' },
          ]}
        />
      </MemoryRouter>
    );

    expect(screen.getByRole('link', { name: 'Empresas' })).toHaveAttribute(
      'href',
      '/admin/companies'
    );
    expect(screen.getByRole('link', { name: 'Unidade RS' })).toHaveAttribute(
      'href',
      '/companies/unidade-rs/dashboard'
    );
    expect(
      screen.queryByRole('link', { name: 'Documentos' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
  });

  it('renders the last item as plain text even when it has a "to"', () => {
    render(
      <MemoryRouter>
        <BreadcrumbBar
          items={[{ label: 'Empresas', to: '/admin/companies' }]}
        />
      </MemoryRouter>
    );

    expect(
      screen.queryByRole('link', { name: 'Empresas' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Empresas')).toBeInTheDocument();
  });
});

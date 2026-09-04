import { renderHook } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { useCompanyBreadcrumbs } from '../../pages/company/useCompanyBreadcrumbs';

function renderWithCompanyId(
  companyId: string | undefined,
  currentPage: string,
  options?: Parameters<typeof useCompanyBreadcrumbs>[1]
) {
  const path = companyId ? `/companies/${companyId}/page` : '/companies//page';

  return renderHook(() => useCompanyBreadcrumbs(currentPage, options), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={children} path="/companies/:companyId/page" />
        </Routes>
      </MemoryRouter>
    ),
  });
}

describe('useCompanyBreadcrumbs', () => {
  it('links the company crumb to that company dashboard', () => {
    const { result } = renderWithCompanyId('unidade-rs', 'Painel');

    expect(result.current).toEqual([
      { label: 'Empresas', to: '/admin/companies' },
      { label: 'Empresa', to: '/companies/unidade-rs/dashboard' },
      { label: 'Painel' },
    ]);
  });

  it('adds a parent crumb linked to the company when both parent and companyId are present', () => {
    const { result } = renderWithCompanyId('unidade-rs', 'Detalhes', {
      parent: {
        label: 'Licenças',
        to: (companyId) => `/companies/${companyId}/licenses`,
      },
    });

    expect(result.current).toEqual([
      { label: 'Empresas', to: '/admin/companies' },
      { label: 'Empresa', to: '/companies/unidade-rs/dashboard' },
      { label: 'Licenças', to: '/companies/unidade-rs/licenses' },
      { label: 'Detalhes' },
    ]);
  });

  it('renders the parent crumb without a link when it has no "to" builder', () => {
    const { result } = renderWithCompanyId('unidade-rs', 'Detalhes', {
      parent: { label: 'Licenças' },
    });

    expect(result.current.at(-2)).toEqual({ label: 'Licenças', to: undefined });
  });
});

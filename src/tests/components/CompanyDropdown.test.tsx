import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { CompanyDropdown } from '../../components/layout/CompanyDropdown';
import type { CompanyNavigationItem } from '../../features/companies/companyNavigation.mock';

const mockCompanies: CompanyNavigationItem[] = [
  {
    attentionCount: 0,
    city: 'Porto Alegre',
    compliance: 100,
    id: 'unidade-rs',
    licenseCount: 6,
    name: 'Unidade Industrial RS',
    overdueCount: 0,
    segment: 'Siderurgia',
    state: 'RS',
    status: 'active',
    updatedAt: 'Hoje',
  },
  {
    attentionCount: 1,
    city: 'Sorocaba',
    compliance: 85,
    id: 'fabrica-sp',
    licenseCount: 4,
    name: 'Fábrica São Paulo',
    overdueCount: 0,
    segment: 'Metalúrgica',
    state: 'SP',
    status: 'active',
    updatedAt: 'Hoje',
  },
  {
    attentionCount: 0,
    city: 'Curitiba',
    compliance: 90,
    id: 'empresa-nome-longo-excepcionalmente-extenso',
    licenseCount: 2,
    name: 'Empresa Super Longa de Testes com Nome Extenso Demais Ltda',
    overdueCount: 0,
    segment: 'Serviços',
    state: 'PR',
    status: 'active',
    updatedAt: 'Hoje',
  },
];

function renderDropdown(
  activeCompanyId: string = 'unidade-rs',
  companies: CompanyNavigationItem[] = mockCompanies,
  initialRoute: string = '/companies/unidade-rs/indicators'
) {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/companies/:companyId/*"
          element={
            <CompanyDropdown
              activeCompanyId={activeCompanyId}
              companies={companies}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );
}

describe('CompanyDropdown', () => {
  it('renders the active company name in the trigger button', () => {
    renderDropdown('unidade-rs');

    const button = screen.getByRole('button', { name: /empresa em contexto/i });
    expect(button).toHaveTextContent('Unidade Industrial RS');
  });

  it('renders exceptionally long company names with truncation styling', () => {
    renderDropdown('empresa-nome-longo-excepcionalmente-extenso');

    const button = screen.getByRole('button', { name: /empresa em contexto/i });
    const labelSpan = button.querySelector('span.truncate');

    expect(labelSpan).toBeInTheDocument();
    expect(labelSpan).toHaveTextContent(
      'Empresa Super Longa de Testes com Nome Extenso Demais Ltda'
    );
    expect(labelSpan?.className).toContain('truncate');
  });

  it('falls back to default context label when company is not found', () => {
    renderDropdown('id-desconhecido');

    const button = screen.getByRole('button', { name: /empresa em contexto/i });
    expect(button).toHaveTextContent('Empresa em contexto');
  });

  it('opens the dropdown list on click and displays options', async () => {
    const user = userEvent.setup();
    renderDropdown('unidade-rs');

    const trigger = screen.getByRole('button', {
      name: /empresa em contexto/i,
    });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    await user.click(trigger);

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /unidade industrial rs/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: /fábrica são paulo/i })
    ).toBeInTheDocument();
  });

  it('closes the dropdown when pressing Escape', async () => {
    const user = userEvent.setup();
    renderDropdown('unidade-rs');

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/companies/unidade-rs/dashboard']}>
        <div>
          <button type="button" data-testid="outside-button">
            Fora
          </button>
          <CompanyDropdown
            activeCompanyId="unidade-rs"
            companies={mockCompanies}
          />
        </div>
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByTestId('outside-button'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders search input when company list > 10 items and filters results', async () => {
    const user = userEvent.setup();
    const manyCompanies: CompanyNavigationItem[] = Array.from(
      { length: 12 },
      (_, i) => ({
        attentionCount: 0,
        city: i % 2 === 0 ? 'Porto Alegre' : 'São Paulo',
        compliance: 100,
        id: `empresa-${i + 1}`,
        licenseCount: 1,
        name: `Empresa ${i + 1}`,
        overdueCount: 0,
        segment: 'Outros',
        state: i % 2 === 0 ? 'RS' : 'SP',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('empresa-1', manyCompanies);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );

    const searchInput = screen.getByPlaceholderText(/buscar empresa/i);
    expect(searchInput).toBeInTheDocument();

    await user.type(searchInput, 'Empresa 12');

    expect(
      screen.getByRole('option', { name: /empresa 12/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /empresa 2/i })
    ).not.toBeInTheDocument();
  });

  it('renders empty message when search matches no companies', async () => {
    const user = userEvent.setup();
    const manyCompanies: CompanyNavigationItem[] = Array.from(
      { length: 12 },
      (_, i) => ({
        attentionCount: 0,
        city: 'POA',
        compliance: 100,
        id: `company-${i}`,
        licenseCount: 1,
        name: `Company ${i}`,
        overdueCount: 0,
        segment: 'Test',
        state: 'RS',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('company-0', manyCompanies);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    const searchInput = screen.getByPlaceholderText(/buscar empresa/i);

    await user.type(searchInput, 'InexistenteXYZ');

    expect(screen.getByText('Nenhuma empresa encontrada')).toBeInTheDocument();
  });

  it('selects a new company and closes dropdown', async () => {
    const user = userEvent.setup();
    renderDropdown('unidade-rs');

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    const option = screen.getByRole('option', { name: /fábrica são paulo/i });

    await user.click(option);

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

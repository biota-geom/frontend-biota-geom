import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CompanyDropdown } from '../../components/layout/CompanyDropdown';
import type { CompanyNavigationItem } from '../../features/companies/companyNavigation.mock';

// Mock do react-router-dom para capturar navegações
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

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

  it('exibe ícone de check somente na empresa atualmente selecionada', async () => {
    const user = userEvent.setup();
    renderDropdown('unidade-rs');

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );

    const selectedOption = screen.getByRole('option', {
      name: /unidade industrial rs/i,
    });
    const otherOption = screen.getByRole('option', {
      name: /fábrica são paulo/i,
    });

    // O item ativo deve ter aria-selected=true; o outro, false
    expect(selectedOption).toHaveAttribute('aria-selected', 'true');
    expect(otherOption).toHaveAttribute('aria-selected', 'false');

    // O destaque visual (fundo e peso da fonte) só aparece no item ativo.
    // Usa `classList` (não substring) porque a classe base já contém
    // `hover:bg-surface-muted`/`focus:bg-surface-muted`, que compartilham
    // a substring com a classe condicional `bg-surface-muted`.
    const selectedClasses = Array.from(selectedOption.classList);
    const otherClasses = Array.from(otherOption.classList);
    expect(selectedClasses).toContain('bg-surface-muted');
    expect(selectedClasses).toContain('font-semibold');
    expect(otherClasses).not.toContain('bg-surface-muted');
    expect(otherClasses).not.toContain('font-semibold');

    // O ícone de check (svg) só é renderizado para a opção selecionada
    expect(selectedOption.querySelector('svg')).toBeInTheDocument();
    expect(otherOption.querySelector('svg')).not.toBeInTheDocument();

    // Estilos estruturais da opção (ex.: cantos arredondados) são
    // compartilhados por todos os itens, independente da seleção
    expect(selectedClasses).toContain('rounded-md');
    expect(otherClasses).toContain('rounded-md');
  });

  it('navega para o dashboard ao trocar empresa em rota aninhada com ID', async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();

    // Rota aninhada do tipo /companies/:id/licenses/:licenseId
    renderDropdown(
      'unidade-rs',
      mockCompanies,
      '/companies/unidade-rs/licenses/abc123'
    );

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    await user.click(
      screen.getByRole('option', { name: /fábrica são paulo/i })
    );

    // Deve redirecionar para o dashboard, não tentar manter a sub-rota /licenses/abc123
    expect(mockNavigate).toHaveBeenCalledWith(
      '/companies/fabrica-sp/dashboard'
    );
  });

  it('mantém o sufixo de rota simples ao trocar empresa', async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();

    // Rota simples do tipo /companies/:id/indicators
    renderDropdown(
      'unidade-rs',
      mockCompanies,
      '/companies/unidade-rs/indicators'
    );

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    await user.click(
      screen.getByRole('option', { name: /fábrica são paulo/i })
    );

    // Deve manter o sufixo /indicators na nova empresa
    expect(mockNavigate).toHaveBeenCalledWith(
      '/companies/fabrica-sp/indicators'
    );
  });

  it('falls back to the dashboard route when the current path does not match the expected company URL shape', async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();

    // Caminho que contém "/companies/" mas não começa por ele — o
    // regex de extração de sufixo não deve reconhecer esse formato.
    render(
      <MemoryRouter
        initialEntries={['/embedded/companies/unidade-rs/indicators']}
      >
        <CompanyDropdown
          activeCompanyId="unidade-rs"
          companies={mockCompanies}
        />
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    await user.click(
      screen.getByRole('option', { name: /fábrica são paulo/i })
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      '/companies/fabrica-sp/dashboard'
    );
  });

  it('não navega ao selecionar a empresa que já está ativa', async () => {
    mockNavigate.mockClear();
    const user = userEvent.setup();
    renderDropdown('unidade-rs');

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    await user.click(
      screen.getByRole('option', { name: /unidade industrial rs/i })
    );

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('reseta o termo de busca ao selecionar uma empresa', async () => {
    const user = userEvent.setup();
    const manyCompanies: CompanyNavigationItem[] = Array.from(
      { length: 12 },
      (_, i) => ({
        attentionCount: 0,
        city: 'Porto Alegre',
        compliance: 100,
        id: `empresa-${i + 1}`,
        licenseCount: 1,
        name: `Empresa ${i + 1}`,
        overdueCount: 0,
        segment: 'Outros',
        state: 'RS',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('empresa-1', manyCompanies);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    await user.type(
      screen.getByPlaceholderText(/buscar empresa/i),
      'Empresa 3'
    );
    await user.click(screen.getByRole('option', { name: /empresa 3/i }));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    // Reabre o dropdown: o campo de busca deve voltar vazio e a lista
    // completa (não apenas o resultado do filtro anterior) deve reaparecer
    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );

    expect(screen.getByPlaceholderText(/buscar empresa/i)).toHaveValue('');
    // A lista completa (12 empresas) reaparece, não só o resultado do
    // filtro anterior ("Empresa 3")
    expect(screen.getAllByRole('option')).toHaveLength(12);
    expect(
      screen.getByRole('option', { name: /empresa 5/i })
    ).toBeInTheDocument();
  });

  it('does not render the search input for exactly 10 companies (boundary)', async () => {
    const user = userEvent.setup();
    const tenCompanies: CompanyNavigationItem[] = Array.from(
      { length: 10 },
      (_, i) => ({
        attentionCount: 0,
        city: 'Porto Alegre',
        compliance: 100,
        id: `empresa-${i + 1}`,
        licenseCount: 1,
        name: `Empresa ${i + 1}`,
        overdueCount: 0,
        segment: 'Outros',
        state: 'RS',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('empresa-1', tenCompanies);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );

    expect(
      screen.queryByPlaceholderText(/buscar empresa/i)
    ).not.toBeInTheDocument();
    // A lista completa continua visível mesmo sem o campo de busca
    expect(
      screen.getByRole('option', { name: /empresa 10/i })
    ).toBeInTheDocument();
  });

  it('ignores leading/trailing whitespace when filtering by search term', async () => {
    const user = userEvent.setup();
    const manyCompanies: CompanyNavigationItem[] = Array.from(
      { length: 12 },
      (_, i) => ({
        attentionCount: 0,
        city: 'Porto Alegre',
        compliance: 100,
        id: `empresa-${i + 1}`,
        licenseCount: 1,
        name: `Empresa ${i + 1}`,
        overdueCount: 0,
        segment: 'Outros',
        state: 'RS',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('empresa-1', manyCompanies);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    await user.type(
      screen.getByPlaceholderText(/buscar empresa/i),
      '  Empresa 12  '
    );

    expect(
      screen.getByRole('option', { name: /empresa 12/i })
    ).toBeInTheDocument();
  });

  it('filters companies by city, case-insensitively', async () => {
    const user = userEvent.setup();
    const companiesByCity: CompanyNavigationItem[] = Array.from(
      { length: 11 },
      (_, i) => ({
        attentionCount: 0,
        city: i === 5 ? 'Manaus' : 'Curitiba',
        compliance: 100,
        id: `empresa-${i + 1}`,
        licenseCount: 1,
        name: `Empresa ${i + 1}`,
        overdueCount: 0,
        segment: 'Outros',
        state: 'RS',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('empresa-1', companiesByCity);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    // Busca em minúsculas por uma cidade armazenada com inicial maiúscula
    await user.type(screen.getByPlaceholderText(/buscar empresa/i), 'manaus');

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Empresa 6');
  });

  it('filters companies by segment, case-insensitively', async () => {
    const user = userEvent.setup();
    const companiesBySegment: CompanyNavigationItem[] = Array.from(
      { length: 11 },
      (_, i) => ({
        attentionCount: 0,
        city: 'Curitiba',
        compliance: 100,
        id: `empresa-${i + 1}`,
        licenseCount: 1,
        name: `Empresa ${i + 1}`,
        overdueCount: 0,
        segment: i === 8 ? 'Bioenergia' : 'Outros',
        state: 'RS',
        status: 'active',
        updatedAt: 'Hoje',
      })
    );

    renderDropdown('empresa-1', companiesBySegment);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    // Busca em minúsculas por um segmento armazenado com inicial maiúscula
    await user.type(
      screen.getByPlaceholderText(/buscar empresa/i),
      'bioenergia'
    );

    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Empresa 9');
  });

  it('shows the city-state line only when both fields are present', async () => {
    const user = userEvent.setup();
    const mixedCompanies: CompanyNavigationItem[] = [
      {
        ...mockCompanies[0],
        id: 'ambos',
        name: 'Empresa Completa',
        city: 'Recife',
        state: 'PE',
      },
      {
        ...mockCompanies[0],
        id: 'so-cidade',
        name: 'Empresa Só Cidade',
        city: 'Recife',
        state: '',
      },
      {
        ...mockCompanies[0],
        id: 'so-estado',
        name: 'Empresa Só Estado',
        city: '',
        state: 'PE',
      },
    ];

    render(
      <MemoryRouter initialEntries={['/companies/ambos/dashboard']}>
        <CompanyDropdown activeCompanyId="ambos" companies={mixedCompanies} />
      </MemoryRouter>
    );

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );

    // A empresa com os dois campos mostra a linha "Cidade - Estado"
    expect(screen.getByText('Recife - PE')).toBeInTheDocument();

    const cityOnlyOption = screen.getByRole('option', {
      name: /empresa só cidade/i,
    });
    const stateOnlyOption = screen.getByRole('option', {
      name: /empresa só estado/i,
    });

    // Com apenas um dos dois campos preenchido, nenhum valor solto de
    // cidade/estado deve vazar para a opção (ex.: "Recife" ou "PE" soltos)
    expect(cityOnlyOption.textContent).not.toContain('Recife');
    expect(stateOnlyOption.textContent).not.toContain('PE');
  });

  it('rotates the chevron indicator while open and resets it when closed', async () => {
    const user = userEvent.setup();
    renderDropdown('unidade-rs');

    const trigger = screen.getByRole('button', {
      name: /empresa em contexto/i,
    });
    const [, chevron] = trigger.querySelectorAll('svg');

    expect(chevron.getAttribute('class')).toContain('transition-transform');
    expect(chevron.getAttribute('class')).not.toContain('rotate-180');

    await user.click(trigger);
    expect(chevron.getAttribute('class')).toContain('rotate-180');

    await user.click(trigger);
    expect(chevron.getAttribute('class')).not.toContain('rotate-180');
  });

  it('anchors the panel to the trigger using relative/inline-block positioning', () => {
    renderDropdown('unidade-rs');

    const trigger = screen.getByRole('button', {
      name: /empresa em contexto/i,
    });

    expect(trigger.parentElement?.className).toContain('relative');
    expect(trigger.parentElement?.className).toContain('inline-block');
  });

  it('attaches the Escape key listener only while open and cleans it up afterwards', async () => {
    const user = userEvent.setup();
    const addSpy = vi.spyOn(document, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');

    renderDropdown('unidade-rs');

    const keydownAdds = () =>
      addSpy.mock.calls.filter(([type]) => type === 'keydown').length;
    const keydownRemoves = () =>
      removeSpy.mock.calls.filter(([type]) => type === 'keydown').length;

    expect(keydownAdds()).toBe(0);

    await user.click(
      screen.getByRole('button', { name: /empresa em contexto/i })
    );
    expect(keydownAdds()).toBe(1);

    await user.keyboard('{Escape}');
    expect(keydownRemoves()).toBeGreaterThanOrEqual(1);

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Company } from '../../features/companies/types';
import { useCompanies } from '../../features/companies/useCompanies';
import { AdminCompaniesPage } from '../../pages/admin/Companies/AdminCompaniesPage';
import { MOCK_AUTH_USER, renderWithAuth } from '../mocks/renderWithAuth';

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

const customersApi = await import('../../services/api/customersApi');

const COMPANIES: Company[] = [
  {
    id: 'customer-1',
    name: 'Unidade Industrial RS',
    status: 'active',
    segment: 'Siderurgia',
    location: 'Porto Alegre - RS',
  },
  {
    id: 'customer-2',
    name: 'Fábrica São Paulo',
    status: 'active',
    segment: 'Metalúrgica',
    location: 'Sorocaba - SP',
  },
  {
    id: 'customer-3',
    name: 'Agro Centro-Oeste',
    status: 'inactive',
    segment: 'Agronegócio',
    location: 'Sorriso - MT',
  },
  {
    id: 'customer-4',
    name: 'Mineradora Goiânia',
    status: 'inactive',
    segment: 'Mineração',
    location: 'Goiânia - GO',
  },
];

const FILTERED_EMPTY_MESSAGE = /nenhuma empresa encontrada para os filtros/i;

function setupUser() {
  return userEvent.setup({ delay: null });
}

/** Renders the listing and waits for the fetched cards to show up. */
async function renderCompanies() {
  vi.mocked(customersApi.listCompanies).mockResolvedValue(COMPANIES);

  renderWithAuth(<AdminCompaniesPage />, {
    status: 'authenticated',
    user: MOCK_AUTH_USER,
  });

  await screen.findByRole('article', { name: /unidade industrial rs/i });
}

function visibleCompanyNames() {
  return screen
    .queryAllByRole('article')
    .map((card) => within(card).getByRole('heading').textContent);
}

function getSearchInput() {
  return screen.getByRole('searchbox', { name: /buscar empresas/i });
}

/** Opens one of the filter dropdowns and picks an option by its label. */
async function selectFilterOption(
  user: ReturnType<typeof userEvent.setup>,
  filterLabel: RegExp,
  optionLabel: string | RegExp
) {
  await user.click(screen.getByRole('button', { name: filterLabel }));
  await user.click(screen.getByRole('option', { name: optionLabel }));
}

describe('AdminCompaniesPage filters', () => {
  beforeEach(() => {
    useCompanies.setState({ companies: [], status: 'idle', error: null });
    vi.resetAllMocks();
  });

  it('enables the search box and lists every company before filtering', async () => {
    await renderCompanies();

    expect(getSearchInput()).toBeEnabled();
    expect(getSearchInput()).toHaveAttribute(
      'placeholder',
      'Buscar por nome da filial, estado ou segmento...'
    );
    expect(visibleCompanyNames()).toHaveLength(4);
  });

  it('filters by company name as the user types', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'unidade');

    expect(visibleCompanyNames()).toEqual(['Unidade Industrial RS']);
  });

  it('filters by segment typed in the search box', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'agronegócio');

    expect(visibleCompanyNames()).toEqual(['Agro Centro-Oeste']);
  });

  it('filters by the city and by the state of the location', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'sorocaba');
    expect(visibleCompanyNames()).toEqual(['Fábrica São Paulo']);

    await user.clear(getSearchInput());
    await user.type(getSearchInput(), 'MT');
    expect(visibleCompanyNames()).toEqual(['Agro Centro-Oeste']);
  });

  it('ignores case and accents in the search', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'GOIANIA');
    expect(visibleCompanyNames()).toEqual(['Mineradora Goiânia']);

    await user.clear(getSearchInput());
    await user.type(getSearchInput(), 'fabrica');
    expect(visibleCompanyNames()).toEqual(['Fábrica São Paulo']);
  });

  it('offers the segments present in the listing, sorted, plus "Todos"', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.click(screen.getByRole('button', { name: /segmento: todos/i }));

    expect(
      screen.getAllByRole('option').map((option) => option.textContent)
    ).toEqual([
      'Todos',
      'Agronegócio',
      'Metalúrgica',
      'Mineração',
      'Siderurgia',
    ]);
  });

  it('filters by segment and reflects the selection on the trigger', async () => {
    const user = setupUser();
    await renderCompanies();

    await selectFilterOption(user, /segmento: todos/i, 'Mineração');

    expect(
      screen.getByRole('button', { name: /segmento: mineração/i })
    ).toBeInTheDocument();
    expect(visibleCompanyNames()).toEqual(['Mineradora Goiânia']);
  });

  it('starts on "Status: Todos" and shows inactive companies too', async () => {
    await renderCompanies();

    expect(
      screen.getByRole('button', { name: /status: todos/i })
    ).toBeInTheDocument();
    expect(visibleCompanyNames()).toContain('Agro Centro-Oeste');
  });

  it('filters by status', async () => {
    const user = setupUser();
    await renderCompanies();

    await selectFilterOption(user, /status: todos/i, 'Ativos');

    expect(visibleCompanyNames()).toEqual([
      'Unidade Industrial RS',
      'Fábrica São Paulo',
    ]);

    await selectFilterOption(user, /status: ativos/i, 'Inativos');

    expect(visibleCompanyNames()).toEqual([
      'Agro Centro-Oeste',
      'Mineradora Goiânia',
    ]);
  });

  it('combines search, segment and status', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'sorocaba');
    await selectFilterOption(user, /segmento: todos/i, 'Metalúrgica');
    await selectFilterOption(user, /status: todos/i, 'Ativos');

    expect(visibleCompanyNames()).toEqual(['Fábrica São Paulo']);

    await selectFilterOption(user, /status: ativos/i, 'Inativos');

    expect(visibleCompanyNames()).toEqual([]);
    expect(screen.getByText(FILTERED_EMPTY_MESSAGE)).toBeInTheDocument();
  });

  it('shows a filter-specific empty state, distinct from the "no company" one', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'empresa inexistente');

    expect(screen.getByText(FILTERED_EMPTY_MESSAGE)).toBeInTheDocument();
    expect(
      screen.queryByText(/nenhuma empresa cadastrada até o momento/i)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /empresas cadastradas/i })
    ).not.toBeInTheDocument();
  });

  it('keeps every result state hidden while the listing is loading', () => {
    vi.mocked(customersApi.listCompanies).mockReturnValue(
      new Promise<Company[]>(() => {})
    );

    renderWithAuth(<AdminCompaniesPage />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
    });

    expect(screen.getByRole('status')).toHaveTextContent(
      /carregando empresas/i
    );
    expect(visibleCompanyNames()).toEqual([]);
    expect(
      screen.queryByText(/nenhuma empresa cadastrada até o momento/i)
    ).not.toBeInTheDocument();
    expect(screen.queryByText(FILTERED_EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /tentar novamente/i })
    ).not.toBeInTheDocument();
  });

  it('keeps the filter empty state out of the way when nothing is registered', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([]);

    renderWithAuth(<AdminCompaniesPage />, {
      status: 'authenticated',
      user: MOCK_AUTH_USER,
    });

    expect(
      await screen.findByText(/nenhuma empresa cadastrada até o momento/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(FILTERED_EMPTY_MESSAGE)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /limpar filtros/i })
    ).not.toBeInTheDocument();
  });

  it('restores the full listing when the filters are cleared', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.type(getSearchInput(), 'goiania');
    await selectFilterOption(user, /status: todos/i, 'Ativos');

    expect(screen.getByText(FILTERED_EMPTY_MESSAGE)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /limpar filtros/i }));

    expect(visibleCompanyNames()).toHaveLength(4);
    expect(getSearchInput()).toHaveValue('');
    expect(
      screen.getByRole('button', { name: /status: todos/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /segmento: todos/i })
    ).toBeInTheDocument();
    expect(screen.queryByText(FILTERED_EMPTY_MESSAGE)).not.toBeInTheDocument();
  });

  it('exposes the dropdown state and closes it with Escape', async () => {
    const user = setupUser();
    await renderCompanies();

    const trigger = screen.getByRole('button', { name: /status: todos/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(screen.getByRole('listbox', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Todos' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('option', { name: 'Ativos' })).toHaveAttribute(
      'aria-selected',
      'false'
    );

    await user.keyboard('a');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(trigger).toHaveAttribute('aria-expanded', 'false');
    });
    expect(screen.queryByRole('option', { name: 'Ativos' })).toBeNull();
  });

  it('closes the dropdown when the user clicks outside of it', async () => {
    const user = setupUser();
    await renderCompanies();

    await user.click(screen.getByRole('button', { name: /segmento: todos/i }));
    expect(screen.getByRole('option', { name: 'Siderurgia' })).toBeVisible();

    await user.click(screen.getByRole('heading', { level: 1 }));

    expect(screen.queryByRole('option', { name: 'Siderurgia' })).toBeNull();
  });
});

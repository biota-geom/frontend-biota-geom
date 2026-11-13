import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';
import { LegislationRadar } from '../../pages/company/LicenseDetails/components/LegislationRadar';
import { toLicenseLegislation } from '../../services/api/legislationsApi';

const RADAR = MOCK_LICENSE_LEGISLATIONS.map(toLicenseLegislation);

function renderRadar(
  props: Partial<Parameters<typeof LegislationRadar>[0]> = {}
) {
  return render(
    <LegislationRadar
      error={null}
      legislations={RADAR}
      onRetry={vi.fn()}
      status="success"
      {...props}
    />
  );
}

describe('LegislationRadar', () => {
  it('lists each legislation with type, number/year, issuer, summary and source', () => {
    renderRadar();

    const items = within(
      screen.getByRole('region', { name: 'Radar de Legislação' })
    ).getAllByRole('listitem');
    expect(items).toHaveLength(3);

    expect(
      within(items[0]).getByRole('heading', { name: 'Lei nº 12.305/2010' })
    ).toBeInTheDocument();
    expect(within(items[0]).getByText('Governo Federal')).toBeInTheDocument();
    expect(
      within(items[0]).getByText(
        'Institui a Política Nacional de Resíduos Sólidos.'
      )
    ).toBeInTheDocument();
    expect(within(items[0]).getByText('Extraída do scan')).toBeInTheDocument();

    expect(
      within(items[1]).getByRole('heading', { name: 'Resolução nº 237/1997' })
    ).toBeInTheDocument();
    expect(within(items[1]).getByText('CONAMA')).toBeInTheDocument();
    expect(within(items[2]).getByText('Manual')).toBeInTheDocument();
  });

  it('keeps the order it receives', () => {
    renderRadar({ legislations: [...RADAR].reverse() });

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    ).toEqual([
      'Lei nº 9.605/1998',
      'Resolução nº 237/1997',
      'Lei nº 12.305/2010',
    ]);
  });

  it('shows a placeholder when the summary is missing', () => {
    renderRadar({
      legislations: [
        {
          ...RADAR[0],
          legislation: { ...RADAR[0].legislation, summary: null },
        },
      ],
    });

    expect(screen.getByText('Ementa não informada.')).toBeInTheDocument();
  });

  it('renders the tag and action slots for each item', () => {
    renderRadar({
      renderActions: (item) => (
        <button type="button">Analisar {item.legislation.number}</button>
      ),
      renderTags: (item) => <span>Impacto {item.impact ?? 'pendente'}</span>,
    });

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('Impacto HIGH')).toBeInTheDocument();
    expect(within(items[1]).getByText('Impacto pendente')).toBeInTheDocument();
    expect(
      within(items[2]).getByRole('button', { name: 'Analisar 9.605' })
    ).toBeInTheDocument();
  });

  it('leaves the slots out when nothing plugs into them', () => {
    const { container } = renderRadar();

    expect(container.querySelector('[data-slot="tags"]')).toBeNull();
    expect(container.querySelector('[data-slot="actions"]')).toBeNull();
  });

  it('shows the empty state with the add button', async () => {
    const onAddLegislation = vi.fn();
    renderRadar({ legislations: [], onAddLegislation });

    expect(
      screen.getByText('Nenhuma legislação vinculada')
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );
    expect(onAddLegislation).toHaveBeenCalledTimes(1);
  });

  it('shows a loading state', () => {
    renderRadar({ status: 'loading' });

    expect(
      screen.getByRole('status', { name: 'Carregando radar de legislação' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('shows the error and retries', async () => {
    const onRetry = vi.fn();
    renderRadar({ error: 'Licença não encontrada.', onRetry, status: 'error' });

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Licença não encontrada.'
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Tentar novamente' })
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('tags an entry that was never opened as new, and only that one', () => {
    renderRadar();

    const items = screen.getAllByRole('listitem');
    expect(within(items[0]).getByText('Novo')).toBeInTheDocument();
    expect(within(items[1]).queryByText('Novo')).not.toBeInTheDocument();
    expect(within(items[2]).getByText('Novo')).toBeInTheDocument();
  });

  it('opens an item to show its cited excerpt and reports it as opened', async () => {
    const onItemOpen = vi.fn();
    renderRadar({ onItemOpen });
    const item = screen.getAllByRole('listitem')[0];

    expect(
      within(item).queryByText('…conforme a Lei nº 12.305/2010…')
    ).not.toBeInTheDocument();
    const toggle = within(item).getByRole('button', { name: 'Ver detalhes' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(toggle);

    expect(
      within(item).getByText('…conforme a Lei nº 12.305/2010…')
    ).toBeInTheDocument();
    expect(
      within(item).getByRole('button', { name: 'Ocultar detalhes' })
    ).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAttribute(
      'aria-controls',
      within(item).getByText('Trecho citado na licença').parentElement?.id
    );
    expect(onItemOpen).toHaveBeenCalledTimes(1);
    expect(onItemOpen).toHaveBeenCalledWith(RADAR[0]);
  });

  it('says so when an opened item has no cited excerpt', async () => {
    renderRadar();

    await userEvent.click(
      within(screen.getAllByRole('listitem')[2]).getByRole('button', {
        name: 'Ver detalhes',
      })
    );

    expect(
      screen.getByText('Nenhum trecho citado para esta legislação.')
    ).toBeInTheDocument();
  });

  it('does not report an item that was already read', async () => {
    const onItemOpen = vi.fn();
    renderRadar({ onItemOpen });

    await userEvent.click(
      within(screen.getAllByRole('listitem')[1]).getByRole('button', {
        name: 'Ver detalhes',
      })
    );

    expect(onItemOpen).not.toHaveBeenCalled();
  });

  it('only reports the opening, not the closing', async () => {
    const onItemOpen = vi.fn();
    renderRadar({ onItemOpen });
    const toggle = within(screen.getAllByRole('listitem')[0]).getByRole(
      'button',
      { name: 'Ver detalhes' }
    );

    await userEvent.click(toggle);
    await userEvent.click(
      within(screen.getAllByRole('listitem')[0]).getByRole('button', {
        name: 'Ocultar detalhes',
      })
    );

    expect(onItemOpen).toHaveBeenCalledTimes(1);
    expect(
      screen.queryByText('Trecho citado na licença')
    ).not.toBeInTheDocument();
  });

  it('opens an unread item without a listener', async () => {
    renderRadar();

    await userEvent.click(
      within(screen.getAllByRole('listitem')[0]).getByRole('button', {
        name: 'Ver detalhes',
      })
    );

    expect(screen.getByText('Trecho citado na licença')).toBeInTheDocument();
  });

  it('offers the impact filter only when asked to', () => {
    renderRadar();

    expect(
      screen.queryByRole('combobox', { name: 'Filtrar por impacto' })
    ).not.toBeInTheDocument();
  });

  it('lists every impact level in the filter and reports the choice', async () => {
    const onImpactFilterChange = vi.fn();
    renderRadar({ onImpactFilterChange });

    const filter = screen.getByRole('combobox', {
      name: 'Filtrar por impacto',
    });
    expect(
      Array.from(filter.querySelectorAll('option')).map((o) => o.textContent)
    ).toEqual([
      'Todos os impactos',
      'Impacta sua operação',
      'Impacto moderado',
      'Baixo impacto',
    ]);
    expect(filter).toHaveValue('');

    await userEvent.selectOptions(filter, 'HIGH');
    expect(onImpactFilterChange).toHaveBeenLastCalledWith('HIGH');

    await userEvent.selectOptions(filter, '');
    expect(onImpactFilterChange).toHaveBeenLastCalledWith(null);
  });

  it('shows the active filter', () => {
    renderRadar({ impactFilter: 'MODERATE', onImpactFilterChange: vi.fn() });

    expect(
      screen.getByRole('combobox', { name: 'Filtrar por impacto' })
    ).toHaveValue('MODERATE');
  });

  it('explains an empty filtered radar without offering to add', () => {
    renderRadar({
      impactFilter: 'HIGH',
      legislations: [],
      onImpactFilterChange: vi.fn(),
    });

    expect(
      screen.getByText(
        'Nenhuma legislação com o impacto “Impacta sua operação”.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Nenhuma legislação vinculada')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Adicionar legislação' })
    ).not.toBeInTheDocument();
  });

  it('keeps the filter available while loading and on error', () => {
    const { rerender } = renderRadar({
      onImpactFilterChange: vi.fn(),
      status: 'loading',
    });
    expect(
      screen.getByRole('combobox', { name: 'Filtrar por impacto' })
    ).toBeInTheDocument();

    rerender(
      <LegislationRadar
        error="Falhou."
        legislations={[]}
        onImpactFilterChange={vi.fn()}
        onRetry={vi.fn()}
        status="error"
      />
    );
    expect(
      screen.getByRole('combobox', { name: 'Filtrar por impacto' })
    ).toBeInTheDocument();
  });
});

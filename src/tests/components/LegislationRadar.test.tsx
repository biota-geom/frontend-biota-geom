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

  it('offers the add button in the header once the radar has entries', async () => {
    const onAddLegislation = vi.fn();
    renderRadar({ onAddLegislation });

    await userEvent.click(
      screen.getByRole('button', { name: 'Adicionar legislação' })
    );
    expect(onAddLegislation).toHaveBeenCalledTimes(1);
  });

  it('hides the add, edit and remove buttons without handlers', () => {
    renderRadar();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    renderRadar({ legislations: [] });
    expect(
      screen.queryByRole('button', { name: 'Adicionar legislação' })
    ).not.toBeInTheDocument();
  });

  it('edits and removes each entry', async () => {
    const onEditLegislation = vi.fn();
    const onRemoveLegislation = vi.fn();
    renderRadar({ onEditLegislation, onRemoveLegislation });

    await userEvent.click(
      screen.getByRole('button', { name: 'Editar Resolução nº 237/1997' })
    );
    expect(onEditLegislation).toHaveBeenCalledWith(RADAR[1]);

    await userEvent.click(
      screen.getByRole('button', { name: 'Remover Lei nº 9.605/1998' })
    );
    expect(onRemoveLegislation).toHaveBeenCalledWith(RADAR[2]);
  });

  it('omits the issuing body line when the act has none', () => {
    renderRadar({
      legislations: [
        {
          ...RADAR[0],
          legislation: { ...RADAR[0].legislation, issuingBody: '' },
        },
      ],
    });

    const item = screen.getByRole('listitem');
    expect(item.querySelectorAll('p')).toHaveLength(1);
  });
});

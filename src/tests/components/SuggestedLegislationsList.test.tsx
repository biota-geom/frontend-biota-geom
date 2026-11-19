import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SuggestedLegislation } from '../../features/licenses/types';
import { SuggestedLegislationsList } from '../../pages/company/Licenses/components/SuggestedLegislationsList';

const LEI: SuggestedLegislation = {
  legislation: {
    type: 'LEI',
    number: '12.305',
    year: 2010,
    issuingBody: 'Governo Federal',
    summary: 'Institui a Política Nacional de Resíduos Sólidos.',
  },
  citedExcerpt: '…conforme a Lei nº 12.305/2010…',
  source: 'SCAN',
  impact: 'HIGH',
};

const RESOLUCAO: SuggestedLegislation = {
  legislation: {
    type: 'RESOLUCAO',
    number: '237',
    year: 1997,
    issuingBody: 'CONAMA',
    summary: null,
  },
  citedExcerpt: null,
  source: 'SCAN',
  impact: null,
};

function renderList(
  props: Partial<Parameters<typeof SuggestedLegislationsList>[0]> = {}
) {
  const onToggle = vi.fn();
  const onImpactChange = vi.fn();
  render(
    <SuggestedLegislationsList
      isSelected={() => true}
      onImpactChange={onImpactChange}
      onToggle={onToggle}
      suggestions={[LEI, RESOLUCAO]}
      {...props}
    />
  );

  return { onImpactChange, onToggle };
}

describe('SuggestedLegislationsList', () => {
  it('renders nothing when the scan found no law', () => {
    const { container } = render(
      <SuggestedLegislationsList
        isSelected={() => true}
        onImpactChange={vi.fn()}
        onToggle={vi.fn()}
        suggestions={[]}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('lists each law with its number, year, excerpt and suggested impact', () => {
    renderList();

    const section = screen.getByRole('region', {
      name: 'Legislações encontradas',
    });
    const [lei, resolucao] = within(section).getAllByRole('listitem');

    expect(within(lei).getByText('Lei nº 12.305/2010')).toBeInTheDocument();
    expect(within(lei).getByText('Governo Federal')).toBeInTheDocument();
    expect(
      within(lei).getByText('…conforme a Lei nº 12.305/2010…')
    ).toBeInTheDocument();
    expect(
      within(lei).getByRole('combobox', {
        name: 'Impacto de Lei nº 12.305/2010',
      })
    ).toHaveValue('HIGH');
    expect(
      within(resolucao).getByText('Resolução nº 237/1997')
    ).toBeInTheDocument();
    expect(
      within(resolucao).getByRole('combobox', {
        name: 'Impacto de Resolução nº 237/1997',
      })
    ).toHaveValue('');
    expect(within(resolucao).queryByRole('blockquote')).not.toBeInTheDocument();
  });

  it('reflects which laws are kept', () => {
    renderList({ isSelected: (suggestion) => suggestion === LEI });

    expect(
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
    ).toBeChecked();
    expect(
      screen.getByRole('checkbox', {
        name: 'Vincular Resolução nº 237/1997',
      })
    ).not.toBeChecked();
  });

  it('reports unchecking and checking a law', async () => {
    const user = userEvent.setup();
    const { onToggle } = renderList();

    await user.click(
      screen.getByRole('checkbox', { name: 'Vincular Lei nº 12.305/2010' })
    );

    expect(onToggle).toHaveBeenCalledWith(LEI, false);
  });

  it('reports a changed impact, including clearing it', async () => {
    const user = userEvent.setup();
    const { onImpactChange } = renderList();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Impacto de Lei nº 12.305/2010' }),
      'LOW'
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Impacto de Lei nº 12.305/2010' }),
      ''
    );

    expect(onImpactChange).toHaveBeenNthCalledWith(1, LEI, 'LOW');
    expect(onImpactChange).toHaveBeenNthCalledWith(2, LEI, null);
  });

  it('disables every control while saving', () => {
    renderList({ disabled: true });

    for (const checkbox of screen.getAllByRole('checkbox')) {
      expect(checkbox).toBeDisabled();
    }
    for (const select of screen.getAllByRole('combobox')) {
      expect(select).toBeDisabled();
    }
  });
});

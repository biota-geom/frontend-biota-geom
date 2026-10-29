import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConditionFulfillmentList } from '../../pages/company/LicenseDetails/components/ConditionFulfillmentList';
import type { LicenseConditionDetail } from '../../features/licenses/types';

const CONDITION_A: LicenseConditionDetail = {
  id: 'cond-a',
  itemNumber: '1.1',
  isEnvironmentalDescriptor: false,
  environmentalDescriptor: 'Recursos Hídricos',
  name: null,
  description: 'Manter registro de estacionamento.',
  conditionType: 'Informativo',
  periodicity: 'NA',
  deadline: null,
  status: 'Em andamento',
  completionDate: null,
  responsibleName: 'Lucas',
  hasDelivery: null,
  isViolated: false,
};

const CONDITION_B: LicenseConditionDetail = {
  id: 'cond-b',
  itemNumber: '1.2',
  isEnvironmentalDescriptor: false,
  environmentalDescriptor: 'Recursos Hídricos',
  name: null,
  description: 'Apresentar relatório trimestral.',
  conditionType: 'Periódico',
  periodicity: 'Trimestral',
  deadline: '2027-01-01T00:00:00.000Z',
  status: 'Em andamento',
  completionDate: null,
  responsibleName: 'Ana',
  hasDelivery: null,
  isViolated: false,
};

describe('ConditionFulfillmentList', () => {
  it('renders one row per condition with item number, description and type', () => {
    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onSelect={vi.fn()}
        selections={{}}
      />
    );

    expect(screen.getByText('1.1')).toBeInTheDocument();
    expect(
      screen.getByText('Manter registro de estacionamento.')
    ).toBeInTheDocument();
    expect(screen.getByText('(Informativo)')).toBeInTheDocument();

    expect(screen.getByText('1.2')).toBeInTheDocument();
    expect(
      screen.getByText('Apresentar relatório trimestral.')
    ).toBeInTheDocument();
    expect(screen.getByText('(Periódico)')).toBeInTheDocument();
  });

  it('starts with no selection — all aria-pressed are false', () => {
    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A]}
        onSelect={vi.fn()}
        selections={{}}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('reports the answer chosen for a condition', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onSelect={onSelect}
        selections={{}}
      />
    );

    const groupA = screen.getByRole('group', { name: /1\.1/i });
    const groupB = screen.getByRole('group', { name: /1\.2/i });
    await user.click(within(groupA).getByRole('button', { name: 'Cumprida' }));
    await user.click(
      within(groupB).getByRole('button', { name: 'Não cumprida' })
    );

    expect(onSelect.mock.calls).toEqual([
      ['cond-a', true],
      ['cond-b', false],
    ]);
  });

  it('shows the answers it is given as pressed buttons', () => {
    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onSelect={vi.fn()}
        selections={{ 'cond-a': false }}
      />
    );

    const groupA = screen.getByRole('group', { name: /1\.1/i });
    expect(
      within(groupA).getByRole('button', { name: 'Cumprida' })
    ).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(groupA).getByRole('button', { name: 'Não cumprida' })
    ).toHaveAttribute('aria-pressed', 'true');

    const groupB = screen.getByRole('group', { name: /1\.2/i });
    within(groupB)
      .getAllByRole('button')
      .forEach((button) => {
        expect(button).toHaveAttribute('aria-pressed', 'false');
      });
  });

  it('shows an empty state message when conditions array is empty', () => {
    render(
      <ConditionFulfillmentList
        conditions={[]}
        onSelect={vi.fn()}
        selections={{}}
      />
    );

    expect(
      screen.getByText('Nenhuma condicionante cadastrada para esta licença.')
    ).toBeInTheDocument();
  });

  it('renders the row addon under each condition', () => {
    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onSelect={vi.fn()}
        renderRowAddon={(condition) => (
          <span>Extra de {condition.itemNumber}</span>
        )}
        selections={{}}
      />
    );

    const [rowA, rowB] = screen.getAllByRole('listitem');
    expect(within(rowA!).getByText('Extra de 1.1')).toBeInTheDocument();
    expect(within(rowB!).getByText('Extra de 1.2')).toBeInTheDocument();
  });
});

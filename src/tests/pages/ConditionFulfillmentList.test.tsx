import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConditionFulfillmentList } from '../../pages/company/LicenseDetails/components/ConditionFulfillmentList';
import type { LicenseConditionDetail } from '../../features/licenses/types';

const CONDITION_A: LicenseConditionDetail = {
  id: 'cond-a',
  itemNumber: '1.1',
  description: 'Manter registro de estacionamento.',
  conditionType: 'Informativo',
  periodicity: 'NA',
  deadline: null,
  status: 'Em andamento',
  completionDate: null,
  responsibleName: 'Lucas',
  isViolated: false,
};

const CONDITION_B: LicenseConditionDetail = {
  id: 'cond-b',
  itemNumber: '1.2',
  description: 'Apresentar relatório trimestral.',
  conditionType: 'Periódico',
  periodicity: 'Trimestral',
  deadline: '2027-01-01T00:00:00.000Z',
  status: 'Em andamento',
  completionDate: null,
  responsibleName: 'Ana',
  isViolated: false,
};

describe('ConditionFulfillmentList', () => {
  it('renders one row per condition with item number, description and type', () => {
    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onChange={vi.fn()}
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
      <ConditionFulfillmentList conditions={[CONDITION_A]} onChange={vi.fn()} />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  });

  it('calls onChange with isComplete=false when only some rows are answered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onChange={onChange}
      />
    );

    // Answer only the first condition
    const groupA = screen.getByRole('group', { name: /1\.1/i });
    await user.click(within(groupA).getByRole('button', { name: 'Cumprida' }));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[1]).toBe(false); // isComplete
  });

  it('calls onChange with isComplete=true when all rows are answered', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A, CONDITION_B]}
        onChange={onChange}
      />
    );

    const groupA = screen.getByRole('group', { name: /1\.1/i });
    const groupB = screen.getByRole('group', { name: /1\.2/i });

    await user.click(within(groupA).getByRole('button', { name: 'Cumprida' }));
    await user.click(
      within(groupB).getByRole('button', { name: 'Não cumprida' })
    );

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    expect(lastCall[1]).toBe(true); // isComplete

    const rows = lastCall[0] as {
      conditionId: string;
      fulfilled: boolean | undefined;
    }[];
    expect(rows).toEqual([
      {
        conditionId: 'cond-a',
        itemNumber: '1.1',
        description: 'Manter registro de estacionamento.',
        conditionType: 'Informativo',
        fulfilled: true,
      },
      {
        conditionId: 'cond-b',
        itemNumber: '1.2',
        description: 'Apresentar relatório trimestral.',
        conditionType: 'Periódico',
        fulfilled: false,
      },
    ]);
  });

  it('overwrites selection when the user clicks the other button', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <ConditionFulfillmentList
        conditions={[CONDITION_A]}
        onChange={onChange}
      />
    );

    const group = screen.getByRole('group', { name: /1\.1/i });
    await user.click(within(group).getByRole('button', { name: 'Cumprida' }));
    await user.click(
      within(group).getByRole('button', { name: 'Não cumprida' })
    );

    // Last call should have fulfilled: false
    const lastRows = onChange.mock.calls[onChange.mock.calls.length - 1][0] as {
      fulfilled: boolean | undefined;
    }[];
    expect(lastRows[0].fulfilled).toBe(false);

    // "Não cumprida" must be pressed, "Cumprida" must not
    const cumpridaBtn = within(group).getByRole('button', { name: 'Cumprida' });
    const naoCumpridaBtn = within(group).getByRole('button', {
      name: 'Não cumprida',
    });
    expect(cumpridaBtn).toHaveAttribute('aria-pressed', 'false');
    expect(naoCumpridaBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows an empty state message when conditions array is empty', () => {
    render(<ConditionFulfillmentList conditions={[]} onChange={vi.fn()} />);

    expect(
      screen.getByText('Nenhuma condicionante cadastrada para esta licença.')
    ).toBeInTheDocument();
  });
});

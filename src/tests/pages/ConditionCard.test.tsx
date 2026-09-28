import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { LicenseCondition } from '../../features/licenseConditions/types';
import { ConditionCard } from '../../pages/company/Conditions/components/ConditionCard';

const CONDITION: LicenseCondition = {
  id: 'condition-1',
  licenseId: 'license-1',
  title: 'Automonitoramento Atmosférico',
  description: 'Avaliação periódica de emissões.',
  category: 'Emissões',
  dueDate: '2026-02-11T00:00:00.000Z',
  riskLevel: 'RISK',
};

function renderCard(
  overrides: Partial<React.ComponentProps<typeof ConditionCard>> = {}
) {
  const props = {
    condition: CONDITION,
    onDelete: vi.fn(),
    onEdit: vi.fn(),
    ...overrides,
  };

  render(<ConditionCard {...props} />);

  return props;
}

describe('ConditionCard', () => {
  it('renders the risk styling, label and formatted due date', () => {
    renderCard();

    expect(
      screen.getByRole('article', { name: 'Automonitoramento Atmosférico' })
    ).toHaveClass('border-rose-500');
    expect(screen.getByText('RISCO')).toBeInTheDocument();
    expect(screen.getByText('11/02/2026')).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Editar Automonitoramento Atmosférico',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Excluir Automonitoramento Atmosférico',
      })
    ).toBeInTheDocument();
  });

  it('renders the attention label in PT-BR', () => {
    renderCard({
      condition: {
        id: 'condition-2',
        licenseId: 'license-2',
        title: 'Relatório Semestral de Efluentes Líquidos',
        description: 'Laudos de análises físico-químicas.',
        category: 'Recursos Hídricos',
        dueDate: '2026-04-01T00:00:00.000Z',
        riskLevel: 'ATTENTION',
      },
    });

    expect(screen.getByText('ATENÇÃO')).toBeInTheDocument();
  });

  it('hands the whole condition to the edit handler', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderCard();

    await user.click(
      screen.getByRole('button', {
        name: 'Editar Automonitoramento Atmosférico',
      })
    );

    expect(onEdit).toHaveBeenCalledWith(CONDITION);
  });

  it('hands the whole condition to the delete handler', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderCard();

    await user.click(
      screen.getByRole('button', {
        name: 'Excluir Automonitoramento Atmosférico',
      })
    );

    expect(onDelete).toHaveBeenCalledWith(CONDITION);
  });
});

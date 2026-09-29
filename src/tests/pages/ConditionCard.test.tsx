import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionCard } from '../../pages/company/Conditions/components/ConditionCard';

describe('ConditionCard', () => {
  it('renders the risk styling, label and formatted due date', () => {
    render(
      <ConditionCard
        condition={{
          id: 'condition-1',
          title: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          category: 'Emissões',
          dueDate: '2026-02-11T00:00:00.000Z',
          riskLevel: 'RISK',
        }}
      />
    );

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
    render(
      <ConditionCard
        condition={{
          id: 'condition-2',
          title: 'Relatório Semestral de Efluentes Líquidos',
          description: 'Laudos de análises físico-químicas.',
          category: 'Recursos Hídricos',
          dueDate: '2026-04-01T00:00:00.000Z',
          riskLevel: 'ATTENTION',
        }}
      />
    );

    expect(screen.getByText('ATENÇÃO')).toBeInTheDocument();
  });
});

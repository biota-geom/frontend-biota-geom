import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ConditionCard } from '../../pages/company/Conditions/components/ConditionCard';

describe('ConditionCard', () => {
  it('renders the risk styling, label and formatted due date', () => {
    render(
      <ConditionCard
        condition={{
          id: 'condition-1',
          licenseId: 'license-1',
          name: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          environmentalDescriptor: 'Emissões',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-02-11T00:00:00.000Z',
          status: 'Regular',
          hasDelivery: true,
          isViolated: true,
          riskLevel: 'RISK',
        }}
        onEdit={vi.fn()}
      />
    );

    expect(
      screen.getByRole('article', { name: 'Automonitoramento Atmosférico' })
    ).toHaveClass('border-rose-500');
    expect(screen.getByText('RISCO')).toBeInTheDocument();
    expect(screen.getByText('11/02/2026')).toBeInTheDocument();
    expect(
      screen.getByText('Descritor ambiental:').nextElementSibling
    ).toHaveTextContent('Emissões');
    expect(screen.getByText('Violada')).toBeInTheDocument();
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
          licenseId: 'license-1',
          name: 'Relatório Semestral de Efluentes Líquidos',
          description: 'Laudos de análises físico-químicas.',
          environmentalDescriptor: 'Consumo de Água',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-04-01T00:00:00.000Z',
          status: 'Atenção',
          hasDelivery: false,
          isViolated: false,
          riskLevel: 'ATTENTION',
        }}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('ATENÇÃO')).toBeInTheDocument();
  });
});

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
    expect(screen.getByText('Não entregue')).toBeInTheDocument();
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

  it('renders the attention label in PT-BR and omits delivery tag when hasDelivery is false', () => {
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
    expect(screen.queryByText('Entregue')).not.toBeInTheDocument();
    expect(screen.queryByText('Não entregue')).not.toBeInTheDocument();
  });

  it('renders "Entregue" badge when condition has delivery and is fulfilled', () => {
    render(
      <ConditionCard
        condition={{
          id: 'condition-3',
          licenseId: 'license-1',
          name: 'Manifesto de Transporte de Resíduos - MTR',
          description: 'Comprovantes de destinação de resíduos.',
          environmentalDescriptor: 'Resíduos Sólidos',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-05-15T00:00:00.000Z',
          status: 'Regular',
          hasDelivery: true,
          isViolated: false,
          riskLevel: 'REGULAR',
          isFulfilled: true,
          conditionStatus: 'FULFILLED',
          completionDate: '2026-05-10T14:30:00.000Z',
        }}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('REGULAR')).toBeInTheDocument();
    const deliveredBadge = screen.getByText('Entregue');
    expect(deliveredBadge).toBeInTheDocument();
    expect(deliveredBadge).toHaveClass('bg-emerald-100', 'text-emerald-800');
    expect(screen.queryByText('Não entregue')).not.toBeInTheDocument();
  });

  it('renders "Não entregue" badge when condition has delivery and is pending', () => {
    render(
      <ConditionCard
        condition={{
          id: 'condition-4',
          licenseId: 'license-1',
          name: 'Laudo de Emissões Atmosféricas',
          description: 'Laudo semestral de chaminés.',
          environmentalDescriptor: 'Emissões',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-06-20T00:00:00.000Z',
          status: 'Regular',
          hasDelivery: true,
          isViolated: false,
          riskLevel: 'REGULAR',
          isFulfilled: false,
          conditionStatus: 'IN_PROGRESS',
        }}
        onEdit={vi.fn()}
      />
    );

    expect(screen.getByText('REGULAR')).toBeInTheDocument();
    const notDeliveredBadge = screen.getByText('Não entregue');
    expect(notDeliveredBadge).toBeInTheDocument();
    expect(notDeliveredBadge).toHaveClass('bg-slate-100', 'text-slate-700');
    expect(screen.queryByText('Entregue')).not.toBeInTheDocument();
  });
});

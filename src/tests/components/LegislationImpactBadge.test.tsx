import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LegislationImpactBadge } from '../../pages/company/LicenseDetails/components/LegislationImpactBadge';

describe('LegislationImpactBadge', () => {
  it.each([
    ['HIGH', 'Impacta sua operação', 'bg-rose-100'],
    ['MODERATE', 'Impacto moderado', 'bg-amber-100'],
    ['LOW', 'Baixo impacto', 'bg-emerald-100'],
    [null, 'Sem classificação', 'bg-surface-muted'],
  ] as const)('shows %s as "%s"', (impact, label, colorClass) => {
    render(<LegislationImpactBadge impact={impact} />);

    expect(screen.getByText(label)).toHaveClass(colorClass);
  });
});

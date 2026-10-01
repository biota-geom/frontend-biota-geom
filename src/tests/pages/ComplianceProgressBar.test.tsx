import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComplianceProgressBar } from '../../pages/company/Conditions/components/ComplianceProgressBar';

function renderBar(
  totalActive: number,
  inCompliance: number,
  compliancePercentage: number
) {
  render(
    <ComplianceProgressBar
      compliance={{ totalActive, inCompliance, compliancePercentage }}
    />
  );

  return {
    bar: screen.getByRole('progressbar'),
    fill: screen.getByTestId('compliance-progress-fill'),
  };
}

describe('ComplianceProgressBar', () => {
  it('renders the label, counts and percentage', () => {
    renderBar(8, 4, 50);

    expect(
      screen.getByRole('heading', { name: 'Conformidade Geral' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('4 de 8 condicionantes em dia')
    ).toBeInTheDocument();
    expect(screen.getByText('50%')).toHaveClass('text-5xl', 'font-bold');
  });

  it('fills exactly half of the track at 50%', () => {
    const { bar, fill } = renderBar(8, 4, 50);

    expect(bar).toHaveClass('bg-slate-100');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(fill).toHaveClass('bg-emerald-500');
    expect(fill).toHaveStyle({ width: '50%' });
  });

  it('fills the whole track at 100% without overflowing it', () => {
    const { bar, fill } = renderBar(3, 3, 100);

    expect(fill).toHaveStyle({ width: '100%' });
    expect(bar).toHaveClass('overflow-hidden');
  });

  it('shows 100% for a company without active conditions', () => {
    const { fill } = renderBar(0, 0, 100);

    expect(
      screen.getByText('0 de 0 condicionantes em dia')
    ).toBeInTheDocument();
    expect(fill).toHaveStyle({ width: '100%' });
  });

  it('clamps out-of-range percentages to the track bounds', () => {
    const { fill } = renderBar(1, 1, 120);
    expect(fill).toHaveStyle({ width: '100%' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders an empty bar at 0%', () => {
    const { bar, fill } = renderBar(2, 0, -5);
    expect(fill).toHaveStyle({ width: '0%' });
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });
});

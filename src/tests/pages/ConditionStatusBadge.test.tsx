import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ConditionStatusBadge } from '../../pages/company/LicenseDetails/components/ConditionStatusBadge';

describe('ConditionStatusBadge', () => {
  it('shows when a fulfilled condition was met', () => {
    render(
      <ConditionStatusBadge
        completionDate="2026-03-12T00:00:00.000Z"
        status="FULFILLED"
      />
    );

    expect(screen.getByText('Atendida em 12/03/2026')).toBeInTheDocument();
  });

  it('omits the date when a fulfilled condition has none recorded', () => {
    render(<ConditionStatusBadge status="FULFILLED" />);

    expect(screen.getByText('Atendida')).toBeInTheDocument();
  });

  it('ignores a completion date that is not a usable timestamp', () => {
    render(
      <ConditionStatusBadge completionDate="não é data" status="FULFILLED" />
    );

    expect(screen.getByText('Atendida')).toBeInTheDocument();
  });

  it('paints an overdue condition in the alert colour', () => {
    render(<ConditionStatusBadge status="OVERDUE" />);

    const badge = screen.getByText('Atrasada');
    expect(badge).toHaveClass('bg-rose-100');
  });

  it('paints anything else as pending', () => {
    render(<ConditionStatusBadge status="IN_PROGRESS" />);

    const badge = screen.getByText('Em andamento');
    expect(badge).toHaveClass('bg-amber-100');
  });

  it('accepts the already translated label as well as the raw enum', () => {
    render(
      <ConditionStatusBadge
        completionDate="2026-03-12T00:00:00.000Z"
        status="Atendida"
      />
    );

    expect(screen.getByText('Atendida em 12/03/2026')).toBeInTheDocument();
  });
});

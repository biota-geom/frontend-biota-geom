import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LegislationImpactSelect } from '../../pages/company/LicenseDetails/components/LegislationImpactSelect';

function renderSelect(
  props: Partial<Parameters<typeof LegislationImpactSelect>[0]> = {}
) {
  return render(
    <LegislationImpactSelect
      impact={null}
      legislationName="Lei nº 12.305/2010"
      onChange={vi.fn()}
      {...props}
    />
  );
}

describe('LegislationImpactSelect', () => {
  it('lists the unclassified option and each level, most critical first', () => {
    renderSelect();

    const select = screen.getByRole('combobox', {
      name: 'Impacto de Lei nº 12.305/2010',
    });
    expect(
      Array.from(select.querySelectorAll('option')).map((o) => o.textContent)
    ).toEqual([
      'Sem classificação',
      'Impacta sua operação',
      'Impacto moderado',
      'Baixo impacto',
    ]);
  });

  it('shows the current impact', () => {
    renderSelect({ impact: 'MODERATE' });

    expect(screen.getByRole('combobox')).toHaveValue('MODERATE');
  });

  it('shows "Sem classificação" when there is no impact', () => {
    renderSelect({ impact: null });

    expect(screen.getByRole('combobox')).toHaveValue('');
  });

  it('reports the chosen level', async () => {
    const onChange = vi.fn();
    renderSelect({ onChange });

    await userEvent.selectOptions(screen.getByRole('combobox'), 'HIGH');

    expect(onChange).toHaveBeenCalledWith('HIGH');
  });

  it('reports null when the classification is cleared', async () => {
    const onChange = vi.fn();
    renderSelect({ impact: 'LOW', onChange });

    await userEvent.selectOptions(screen.getByRole('combobox'), '');

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('can be disabled while saving', () => {
    renderSelect({ disabled: true });

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('is enabled by default', () => {
    renderSelect();

    expect(screen.getByRole('combobox')).toBeEnabled();
  });
});

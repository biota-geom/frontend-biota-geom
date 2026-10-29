import { describe, expect, it } from 'vitest';
import {
  mergeSuggestedConditions,
  toLicenseConditionRow,
} from '../../features/licenses/licenseExtraction';
describe('toLicenseConditionRow', () => {
  it('maps a suggestion to a condition row of the form', () => {
    expect(
      toLicenseConditionRow({
        environmentalDescriptor: 'Resíduos',
        description: 'Relatório semestral',
        conditionType: 'PERIODIC',
        periodicity: 'SEMIANNUAL',
        dueDate: '2026-07-10',
      })
    ).toEqual({
      environmentalDescriptor: 'Resíduos',
      description: 'Relatório semestral',
      conditionType: 'PERIODIC',
      periodicity: 'SEMIANNUAL',
      deadline: '2026-07-10',
      responsibleName: '',
      hasDelivery: true,
    });
  });

  it('leaves missing or unknown values empty for the user to complete', () => {
    expect(
      toLicenseConditionRow({
        environmentalDescriptor: null,
        description: 'Manter licença no local',
        conditionType: 'OTHER',
        periodicity: 'ANNUAL',
        dueDate: null,
      })
    ).toMatchObject({
      environmentalDescriptor: '',
      conditionType: '',
      periodicity: '',
      deadline: '',
      responsibleName: '',
    });
  });

  it('never keeps a periodicity on an informative condition', () => {
    expect(
      toLicenseConditionRow({
        environmentalDescriptor: null,
        description: 'Informativa',
        conditionType: 'INFORMATIVE',
        periodicity: 'ANNUAL',
        dueDate: null,
      }).periodicity
    ).toBe('');
  });
});

describe('mergeSuggestedConditions', () => {
  const suggestion = (description: string) => ({
    environmentalDescriptor: 'Água',
    description,
    conditionType: 'INFORMATIVE',
    periodicity: null,
    dueDate: null,
  });

  it('appends the suggestions after the conditions already in the form', () => {
    const existing = toLicenseConditionRow(suggestion('Manual'));
    const merged = mergeSuggestedConditions(
      [{ ...existing, responsibleName: 'Ana' }],
      [suggestion('Nova A'), suggestion('Nova B')]
    );

    expect(merged.map((row) => row.description)).toEqual([
      'Manual',
      'Nova A',
      'Nova B',
    ]);
    expect(merged[0].responsibleName).toBe('Ana');
  });

  it('skips suggestions already present, ignoring case, accents and spacing', () => {
    const existing = toLicenseConditionRow(
      suggestion('Manter o MTR no veículo.')
    );
    const merged = mergeSuggestedConditions(
      [existing],
      [suggestion('manter o  MTR no veiculo'), suggestion('Nova')]
    );

    expect(merged.map((row) => row.description)).toEqual([
      'Manter o MTR no veículo.',
      'Nova',
    ]);
  });

  it('keeps an obligation the license repeats under another item number', () => {
    const merged = mergeSuggestedConditions(
      [],
      [
        suggestion('Portar o MTR'),
        suggestion('Outra'),
        suggestion('Portar o MTR'),
      ]
    );

    expect(merged.map((row) => row.description)).toEqual([
      'Portar o MTR',
      'Outra',
      'Portar o MTR',
    ]);
  });

  it('does not duplicate rows when the same reading is merged again', () => {
    const reading = [suggestion('Portar o MTR'), suggestion('Portar o MTR')];
    const first = mergeSuggestedConditions([], reading);

    expect(mergeSuggestedConditions(first, reading)).toHaveLength(2);
  });
});

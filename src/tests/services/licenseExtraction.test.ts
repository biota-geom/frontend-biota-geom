import { describe, expect, it } from 'vitest';
import {
  matchIssuingAgency,
  mergeSuggestedConditions,
  toLicenseConditionRow,
} from '../../features/licenses/licenseExtraction';
import type { IssuingAgency } from '../../features/licenses/types';

const AGENCIES: IssuingAgency[] = [
  {
    id: 'fepam',
    name: 'Fundação Estadual de Proteção Ambiental',
    acronym: 'FEPAM',
  },
  {
    id: 'ibama',
    name: 'Instituto Brasileiro do Meio Ambiente',
    acronym: 'IBAMA',
  },
  { id: 'smam', name: 'Secretaria Municipal do Meio Ambiente', acronym: null },
];

describe('matchIssuingAgency', () => {
  it.each([
    ['the acronym', 'FEPAM', 'fepam'],
    ['the acronym in another case', 'fepam', 'fepam'],
    [
      'the full name without accents',
      'Fundacao Estadual de Protecao Ambiental',
      'fepam',
    ],
    [
      'an agency without acronym by name',
      'Secretaria Municipal do Meio Ambiente',
      'smam',
    ],
    [
      'an acronym followed by the name',
      'FEPAM - Fundação Estadual de Proteção Ambiental',
      'fepam',
    ],
    [
      'a longer official name',
      'Fundação Estadual de Proteção Ambiental Henrique Luis Roessler/RS',
      'fepam',
    ],
  ])('selects the agency by %s', (_label, identified, expected) => {
    expect(matchIssuingAgency(identified, AGENCIES)).toBe(expected);
  });

  it.each([
    ['nothing was identified', null],
    ['the text is blank', '   '],
    ['no agency matches', 'CETESB'],
    // Contained in both "Instituto Brasileiro do Meio Ambiente" and
    // "Secretaria Municipal do Meio Ambiente".
    ['the match is ambiguous', 'Meio Ambiente'],
  ])('returns null when %s', (_label, identified) => {
    expect(matchIssuingAgency(identified, AGENCIES)).toBeNull();
  });

  it('does not match a word fragment', () => {
    expect(matchIssuingAgency('FEPAMX', AGENCIES)).toBeNull();
  });

  it('returns null when two agencies share the same acronym', () => {
    expect(
      matchIssuingAgency('FEPAM', [
        ...AGENCIES,
        { id: 'fepam-2', name: 'Outra', acronym: 'FEPAM' },
      ])
    ).toBeNull();
  });
});

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
      [
        suggestion('manter o  MTR no veiculo'),
        suggestion('Nova'),
        suggestion('Nova'),
      ]
    );

    expect(merged.map((row) => row.description)).toEqual([
      'Manter o MTR no veículo.',
      'Nova',
    ]);
  });
});

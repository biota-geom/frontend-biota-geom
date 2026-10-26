import { describe, expect, it } from 'vitest';
import {
  matchIssuingAgency,
  selectedSuggestedConditions,
  toSuggestedConditionRow,
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

describe('toSuggestedConditionRow', () => {
  it('maps a suggestion to an unselected, editable row', () => {
    expect(
      toSuggestedConditionRow({
        environmentalDescriptor: 'Resíduos',
        description: 'Relatório semestral',
        conditionType: 'PERIODIC',
        periodicity: 'SEMIANNUAL',
        dueDate: '2026-07-10',
      })
    ).toEqual({
      selected: false,
      environmentalDescriptor: 'Resíduos',
      description: 'Relatório semestral',
      conditionType: 'PERIODIC',
      periodicity: 'SEMIANNUAL',
      deadline: '2026-07-10',
      responsibleName: '',
      hasDelivery: true,
    });
  });

  it('leaves missing or unknown values empty for manual filling', () => {
    expect(
      toSuggestedConditionRow({
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
    });
  });

  it('never keeps a periodicity on an informative condition', () => {
    expect(
      toSuggestedConditionRow({
        environmentalDescriptor: null,
        description: 'Informativa',
        conditionType: 'INFORMATIVE',
        periodicity: 'ANNUAL',
        dueDate: null,
      }).periodicity
    ).toBe('');
  });
});

describe('selectedSuggestedConditions', () => {
  it('returns only the ticked rows, without the selection flag', () => {
    const base = {
      environmentalDescriptor: 'Água',
      description: 'x',
      conditionType: 'INFORMATIVE',
      periodicity: '',
      deadline: '2026-01-01',
      responsibleName: 'Ana',
      hasDelivery: false,
    };

    expect(
      selectedSuggestedConditions([
        { ...base, selected: true, description: 'escolhida' },
        { ...base, selected: false, description: 'ignorada' },
      ])
    ).toEqual([{ ...base, description: 'escolhida' }]);
  });
});

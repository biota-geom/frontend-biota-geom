import { describe, expect, it } from 'vitest';
import { formatConditionStatus } from '../../features/licenses/conditionStatusFormatting';

describe('formatConditionStatus', () => {
  it('returns "Análise pendente" when the license has no conditions', () => {
    expect(formatConditionStatus(0, 0)).toBe('Análise pendente');
  });

  it('returns "Todas atendidas" when every condition is attended', () => {
    expect(formatConditionStatus(4, 4)).toBe('Todas atendidas');
  });

  it('returns "Todas atendidas" for a single attended condition', () => {
    expect(formatConditionStatus(1, 1)).toBe('Todas atendidas');
  });

  it.each([
    [6, 8, '6 de 8 atendidas'],
    [0, 3, '0 de 3 atendidas'],
    [10, 12, '10 de 12 atendidas'],
    [3, 4, '3 de 4 atendidas'],
  ])(
    'returns "X de Y atendidas" when %i of %i are attended',
    (attended, total, expected) => {
      expect(formatConditionStatus(attended, total)).toBe(expected);
    }
  );
});

import { describe, expect, it } from 'vitest';
import {
  formatLegislationNumber,
  formatLegislationSource,
  formatLegislationType,
} from '../../features/legislation/legislationFormatting';

describe('legislationFormatting', () => {
  it('translates every legislation type', () => {
    expect(formatLegislationType('LEI')).toBe('Lei');
    expect(formatLegislationType('DECRETO')).toBe('Decreto');
    expect(formatLegislationType('RESOLUCAO')).toBe('Resolução');
    expect(formatLegislationType('PORTARIA')).toBe('Portaria');
    expect(formatLegislationType('INSTRUCAO_NORMATIVA')).toBe(
      'Instrução Normativa'
    );
    expect(formatLegislationType('OUTRO')).toBe('Outro');
  });

  it('translates the radar sources', () => {
    expect(formatLegislationSource('SCAN')).toBe('Extraída do scan');
    expect(formatLegislationSource('MANUAL')).toBe('Manual');
  });

  it('formats the number with its year', () => {
    expect(formatLegislationNumber({ number: '12.305', year: 2010 })).toBe(
      'nº 12.305/2010'
    );
  });
});

import { describe, expect, it } from 'vitest';
import {
  LEGISLATION_IMPACTS,
  formatLegislationImpact,
  formatLegislationNumber,
  formatLegislationSource,
  formatLegislationType,
  parseLegislationImpact,
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

  it('translates every impact level and the missing classification', () => {
    expect(formatLegislationImpact('HIGH')).toBe('Impacta sua operação');
    expect(formatLegislationImpact('MODERATE')).toBe('Impacto moderado');
    expect(formatLegislationImpact('LOW')).toBe('Baixo impacto');
    expect(formatLegislationImpact(null)).toBe('Sem classificação');
  });

  it('lists the impact levels most critical first', () => {
    expect(LEGISLATION_IMPACTS).toEqual(['HIGH', 'MODERATE', 'LOW']);
  });

  it('parses a select value back into an impact level', () => {
    expect(parseLegislationImpact('MODERATE')).toBe('MODERATE');
    expect(parseLegislationImpact('')).toBeNull();
    expect(parseLegislationImpact('CRITICAL')).toBeNull();
  });
});

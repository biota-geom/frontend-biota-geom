import { describe, expect, it } from 'vitest';
import {
  EMPTY_LEGISLATION_FORM,
  hasLegislationChanged,
  legislationFormSchema,
  toLegislationFormResult,
} from '../../features/legislation/legislationFormValidation';
import { LEGISLATION_TYPES } from '../../features/legislation/legislationFormatting';

const VALID = {
  type: 'LEI' as const,
  number: ' 12.305 ',
  year: '2010',
  issuingBody: ' Governo Federal ',
  summary: '',
  citedExcerpt: '  ',
};

const ACT = {
  type: 'LEI' as const,
  number: '12.305',
  year: 2010,
  issuingBody: 'Governo Federal',
  summary: null,
};

function errorsOf(values: Record<string, unknown>) {
  const result = legislationFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(
        result.error.issues.map((issue) => [issue.path[0], issue.message])
      );
}

describe('legislationFormSchema', () => {
  it('offers every act type', () => {
    expect(LEGISLATION_TYPES).toEqual([
      'LEI',
      'DECRETO',
      'RESOLUCAO',
      'PORTARIA',
      'INSTRUCAO_NORMATIVA',
      'OUTRO',
    ]);
  });

  it('trims the fields and turns blank optional ones into null', () => {
    expect(toLegislationFormResult(legislationFormSchema.parse(VALID))).toEqual(
      { legislation: ACT, citedExcerpt: null }
    );
  });

  it('requires type, number, year and issuing body only', () => {
    expect(errorsOf(EMPTY_LEGISLATION_FORM)).toEqual({
      type: 'Selecione o tipo da legislação.',
      number: 'Informe o número da legislação.',
      year: 'Informe o ano da legislação.',
      issuingBody: 'Informe o órgão emissor.',
    });
  });

  it.each([
    ['20a0', 'Informe um ano com 4 dígitos.'],
    ['201', 'Informe um ano com 4 dígitos.'],
    ['0999', 'Informe um ano válido.'],
  ])('rejects the year %s', (year, message) => {
    expect(errorsOf({ ...VALID, year })).toEqual({ year: message });
  });

  it('enforces the backend length limits', () => {
    expect(
      errorsOf({
        ...VALID,
        number: '1'.repeat(51),
        issuingBody: 'a'.repeat(151),
        summary: 'a'.repeat(4096),
        citedExcerpt: 'a'.repeat(4096),
      })
    ).toEqual({
      number: 'O número deve ter no máximo 50 caracteres.',
      issuingBody: 'O órgão emissor deve ter no máximo 150 caracteres.',
      summary: 'A ementa deve ter no máximo 4095 caracteres.',
      citedExcerpt: 'O trecho citado deve ter no máximo 4095 caracteres.',
    });
  });
});

describe('hasLegislationChanged', () => {
  it('is false for the same act', () => {
    expect(hasLegislationChanged(ACT, { ...ACT })).toBe(false);
  });

  it.each([
    ['type', { type: 'DECRETO' as const }],
    ['number', { number: '12.306' }],
    ['year', { year: 2011 }],
    ['issuing body', { issuingBody: 'CONAMA' }],
    ['summary', { summary: 'Nova ementa' }],
  ])('is true when the %s changes', (_, change) => {
    expect(hasLegislationChanged(ACT, { ...ACT, ...change })).toBe(true);
  });
});

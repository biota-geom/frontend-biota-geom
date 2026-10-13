import { describe, expect, it } from 'vitest';
import {
  EMPTY_ESG_FORM_VALUES,
  esgIndicatorsSchema,
  formatMonthLabel,
  getPreviousMonth,
  INTEGER_ONLY_MESSAGE,
  INVALID_NUMBER_MESSAGE,
  isValidMonth,
  NEGATIVE_NUMBER_MESSAGE,
  toFormValues,
  toPayload,
} from '../../features/esgIndicators/esgIndicatorsValidation';

function messagesFor(values: Partial<typeof EMPTY_ESG_FORM_VALUES>) {
  const result = esgIndicatorsSchema.safeParse({
    ...EMPTY_ESG_FORM_VALUES,
    ...values,
  });
  if (result.success) return {};

  return Object.fromEntries(
    result.error.issues.map((issue) => [issue.path[0], issue.message])
  );
}

describe('esgIndicatorsSchema', () => {
  it('accepts a month with only some indicators filled in', () => {
    expect(messagesFor({ water: '1250.5' })).toEqual({});
    expect(messagesFor({})).toEqual({});
  });

  it('accepts zero and decimal values', () => {
    expect(messagesFor({ water: '0', waste: '12.3', energy: '53200' })).toEqual(
      {}
    );
  });

  it('blocks negative values on every indicator', () => {
    expect(
      messagesFor({ water: '-1', waste: '-0.1', employees: '-5', energy: '-2' })
    ).toEqual({
      water: NEGATIVE_NUMBER_MESSAGE,
      waste: NEGATIVE_NUMBER_MESSAGE,
      employees: NEGATIVE_NUMBER_MESSAGE,
      energy: NEGATIVE_NUMBER_MESSAGE,
    });
  });

  it('only accepts an integer for the number of employees', () => {
    expect(messagesFor({ employees: '148.5' })).toEqual({
      employees: INTEGER_ONLY_MESSAGE,
    });
    expect(messagesFor({ employees: '148' })).toEqual({});
    expect(messagesFor({ water: '148.5' })).toEqual({});
  });

  it('rejects text that is not a finite number', () => {
    expect(messagesFor({ water: 'abc', energy: 'Infinity' })).toEqual({
      water: INVALID_NUMBER_MESSAGE,
      energy: INVALID_NUMBER_MESSAGE,
    });
  });
});

describe('form <-> API mapping', () => {
  it('sends only the indicators that were filled in, as numbers', () => {
    expect(
      toPayload({ water: '1250.5', waste: '', employees: '148', energy: '' })
    ).toEqual({ water: 1250.5, employees: 148 });
  });

  it('keeps zero in the payload instead of treating it as blank', () => {
    expect(toPayload({ ...EMPTY_ESG_FORM_VALUES, waste: '0' })).toEqual({
      waste: 0,
    });
  });

  it('turns saved values into form strings, with null as blank', () => {
    expect(
      toFormValues({ water: 1250.5, waste: null, employees: 148, energy: 0 })
    ).toEqual({ water: '1250.5', waste: '', employees: '148', energy: '0' });
  });
});

describe('month helpers', () => {
  it('defaults to the month before the current one', () => {
    expect(getPreviousMonth(new Date(2026, 9, 12))).toBe('2026-09');
  });

  it('rolls January back to December of the previous year', () => {
    expect(getPreviousMonth(new Date(2026, 0, 31))).toBe('2025-12');
  });

  it('validates the YYYY-MM format', () => {
    expect(isValidMonth('2026-09')).toBe(true);
    expect(isValidMonth('2026-12')).toBe(true);
    expect(isValidMonth('')).toBe(false);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-00')).toBe(false);
    expect(isValidMonth('2026-9')).toBe(false);
  });

  it('formats the month label in Portuguese', () => {
    expect(formatMonthLabel('2026-09')).toBe('setembro de 2026');
  });
});

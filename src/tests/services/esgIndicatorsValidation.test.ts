import { describe, expect, it } from 'vitest';
import {
  formatMonthLabel,
  getPreviousMonth,
  INVALID_NUMBER_MESSAGE,
  isValidMonth,
  NEGATIVE_NUMBER_MESSAGE,
  numericIndicatorField,
  toFormValues,
  toPayload,
} from '../../features/esgIndicators/esgIndicatorsValidation';
import type { MonthlyIndicator } from '../../features/esgIndicators/types';

function validate(value: string): string | null {
  const result = numericIndicatorField.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'error';
}

const WATER: MonthlyIndicator = {
  indicator_id: 'uuid-ind-1',
  name: 'Consumo de Água',
  unit: 'm³',
  category: 'Ambiental',
  value: 1250.5,
};

const WASTE: MonthlyIndicator = {
  indicator_id: 'uuid-ind-2',
  name: 'Resíduos Totais',
  unit: 't',
  category: 'Ambiental',
  value: null,
};

const EMPLOYEES: MonthlyIndicator = {
  indicator_id: 'uuid-ind-3',
  name: 'Número de Colaboradores',
  unit: 'un',
  category: 'Social',
  value: 85,
};

describe('numericIndicatorField', () => {
  it('accepts blank (not informed)', () => {
    expect(validate('')).toBeNull();
  });

  it('accepts zero and decimal values', () => {
    expect(validate('0')).toBeNull();
    expect(validate('12.3')).toBeNull();
    expect(validate('53200')).toBeNull();
  });

  it('blocks negative values', () => {
    expect(validate('-1')).toBe(NEGATIVE_NUMBER_MESSAGE);
    expect(validate('-0.1')).toBe(NEGATIVE_NUMBER_MESSAGE);
  });

  it('rejects text that is not a finite number', () => {
    expect(validate('abc')).toBe(INVALID_NUMBER_MESSAGE);
    expect(validate('Infinity')).toBe(INVALID_NUMBER_MESSAGE);
  });
});

describe('form <-> API mapping', () => {
  const indicators = [WATER, WASTE, EMPLOYEES];

  it('sends only the indicators that were filled in, as numbers', () => {
    const values = {
      'uuid-ind-1': '1250.5',
      'uuid-ind-2': '',
      'uuid-ind-3': '85',
    };
    const payload = toPayload(values, indicators);
    expect(payload.records).toEqual([
      { indicator_id: 'uuid-ind-1', value: 1250.5 },
      { indicator_id: 'uuid-ind-3', value: 85 },
    ]);
  });

  it('keeps zero in the payload instead of treating it as blank', () => {
    // Use indicators where EMPLOYEES has no saved value, so blank means omit.
    const noSavedEmployees = indicators.map((ind) =>
      ind.indicator_id === 'uuid-ind-3' ? { ...ind, value: null } : ind
    );
    const values = {
      'uuid-ind-1': '0',
      'uuid-ind-2': '',
      'uuid-ind-3': '',
    };
    const payload = toPayload(values, noSavedEmployees);
    expect(payload.records).toEqual([{ indicator_id: 'uuid-ind-1', value: 0 }]);
  });

  it('sends null for a blank field that had a saved value, so it is cleared', () => {
    // WATER has value 1250.5, clearing it should send null
    const values = {
      'uuid-ind-1': '', // clearing water
      'uuid-ind-2': '', // was already null → omit
      'uuid-ind-3': '100', // updating employees
    };
    const payload = toPayload(values, indicators);
    expect(payload.records).toEqual([
      { indicator_id: 'uuid-ind-1', value: null },
      { indicator_id: 'uuid-ind-3', value: 100 },
    ]);
  });

  it('does not send blank fields that were never saved', () => {
    const noValueIndicators: MonthlyIndicator[] = [
      { ...WATER, value: null },
      { ...WASTE, value: null },
    ];
    const values = { 'uuid-ind-1': '', 'uuid-ind-2': '' };
    const payload = toPayload(values, noValueIndicators);
    expect(payload.records).toEqual([]);
  });

  it('turns saved values into form strings, with null as blank', () => {
    const result = toFormValues([WATER, WASTE, EMPLOYEES]);
    expect(result).toEqual({
      'uuid-ind-1': '1250.5',
      'uuid-ind-2': '',
      'uuid-ind-3': '85',
    });
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

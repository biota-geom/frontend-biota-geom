import { describe, expect, it } from 'vitest';
import {
  DECIMAL_PLACES_MESSAGE,
  newIndicatorSchema,
  numericIndicatorField,
} from '../../features/esgIndicators/esgIndicatorsValidation';

describe('numericIndicatorField decimal places', () => {
  it('accepts up to 4 decimal places', () => {
    expect(numericIndicatorField.safeParse('1250.5').success).toBe(true);
    expect(numericIndicatorField.safeParse('0.0001').success).toBe(true);
    expect(numericIndicatorField.safeParse('12.3456').success).toBe(true);
  });

  it('rejects more than 4 decimal places', () => {
    const result = numericIndicatorField.safeParse('1.23456');

    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(DECIMAL_PLACES_MESSAGE);
  });

  it('still lets a blank value through (not informed)', () => {
    expect(numericIndicatorField.safeParse('').success).toBe(true);
  });
});

describe('newIndicatorSchema', () => {
  const valid = {
    name: 'Consumo de Combustível',
    unit: 'L',
    category: 'Ambiental',
  };

  it('trims name and unit', () => {
    const result = newIndicatorSchema.safeParse({
      ...valid,
      name: '  Efluentes  ',
      unit: ' m³ ',
    });

    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ name: 'Efluentes', unit: 'm³' });
  });

  it('requires name and unit', () => {
    expect(
      newIndicatorSchema.safeParse({ ...valid, name: '  ' }).error?.issues[0]
        ?.message
    ).toBe('Informe o nome do indicador.');
    expect(
      newIndicatorSchema.safeParse({ ...valid, unit: '' }).error?.issues[0]
        ?.message
    ).toBe('Informe a unidade de medida.');
  });

  it('limits name to 120 and unit to 30 characters', () => {
    expect(
      newIndicatorSchema.safeParse({ ...valid, name: 'a'.repeat(121) }).success
    ).toBe(false);
    expect(
      newIndicatorSchema.safeParse({ ...valid, unit: 'a'.repeat(31) }).success
    ).toBe(false);
    expect(
      newIndicatorSchema.safeParse({ ...valid, name: 'a'.repeat(120) }).success
    ).toBe(true);
  });

  it('rejects an unknown category', () => {
    expect(
      newIndicatorSchema.safeParse({ ...valid, category: 'Outra' }).success
    ).toBe(false);
  });
});

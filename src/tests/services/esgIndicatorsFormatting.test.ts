import { describe, expect, it } from 'vitest';
import {
  formatEsgValue,
  formatEsgVariation,
} from '../../features/esgIndicators/esgIndicatorsFormatting';

describe('formatEsgVariation', () => {
  it('shows an increase with an up arrow and one decimal place', () => {
    expect(formatEsgVariation(10)).toBe('▲ 10,0%');
  });

  it('shows a decrease with a down arrow and no minus sign', () => {
    expect(formatEsgVariation(-1.3)).toBe('▼ 1,3%');
  });

  it('shows no change without an arrow', () => {
    expect(formatEsgVariation(0)).toBe('0,0%');
  });

  it('shows a dash when there is no variation', () => {
    expect(formatEsgVariation(null)).toBe('—');
  });
});

describe('formatEsgValue', () => {
  it('formats the value with the indicator unit', () => {
    expect(formatEsgValue(1100, 'm³')).toBe('1.100 m³');
    expect(formatEsgValue(12.3, 't')).toBe('12,3 t');
  });

  it('leaves the unit out when there is none', () => {
    expect(formatEsgValue(148, '')).toBe('148');
  });

  it('shows a dash without a value', () => {
    expect(formatEsgValue(null, 'm³')).toBe('—');
  });
});

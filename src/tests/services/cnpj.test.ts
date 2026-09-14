import { describe, expect, it } from 'vitest';
import { maskCnpj, unmaskCnpj } from '../../features/companies/cnpj';

describe('maskCnpj', () => {
  it('formats a full 14-digit input as 00.000.000/0000-00', () => {
    expect(maskCnpj('12345678000199')).toBe('12.345.678/0001-99');
  });

  it('formats partial input without adding premature separators', () => {
    expect(maskCnpj('12')).toBe('12');
    expect(maskCnpj('123')).toBe('12.3');
  });

  it('strips non-digit characters from the input before masking', () => {
    expect(maskCnpj('12.345.678/0001-99')).toBe('12.345.678/0001-99');
  });

  it('caps at 14 digits, ignoring anything typed beyond that', () => {
    expect(maskCnpj('123456780001999999')).toBe('12.345.678/0001-99');
  });
});

describe('unmaskCnpj', () => {
  it('strips all non-digit characters', () => {
    expect(unmaskCnpj('12.345.678/0001-99')).toBe('12345678000199');
  });
});

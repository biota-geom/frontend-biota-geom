import { describe, expect, it } from 'vitest';
import { getMockCompanyById } from '../../features/companies/getMockCompanyById';

describe('getMockCompanyById', () => {
  it('returns the matching company when the id exists', () => {
    const company = getMockCompanyById('unidade-industrial-rs');

    expect(company?.name).toBe('Unidade Industrial RS');
  });

  it('returns undefined when the id does not match any company', () => {
    expect(getMockCompanyById('empresa-inexistente')).toBeUndefined();
  });

  it('returns undefined when no id is given', () => {
    expect(getMockCompanyById(undefined)).toBeUndefined();
  });
});

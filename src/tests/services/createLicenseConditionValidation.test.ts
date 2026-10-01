import { describe, expect, it } from 'vitest';
import { createLicenseConditionSchema } from '../../features/licenseConditions/createLicenseConditionValidation';

const schema = createLicenseConditionSchema(
  new Date('2026-09-29T12:00:00.000Z')
);

function validValues() {
  return {
    name: 'MTR',
    esgMetricId: 'metric-residuos',
    licenseId: 'license-1',
    responsibleAgency: 'FEPAM',
    dueDate: '2027-05-20',
    status: 'Regular',
    description: '',
  };
}

describe('createLicenseConditionSchema', () => {
  it('requires the condition name', () => {
    const result = schema.safeParse({ ...validValues(), name: '   ' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Informe o nome da condicionante.'
      );
    }
  });

  it('requires a GRI parameter as the category', () => {
    const result = schema.safeParse({ ...validValues(), esgMetricId: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe('Selecione a categoria.');
    }
  });

  it('requires a due date', () => {
    const result = schema.safeParse({ ...validValues(), dueDate: '' });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Informe a data de vencimento.'
      );
    }
  });

  it('rejects today and past due dates', () => {
    for (const dueDate of ['2026-09-29', '2026-09-28']) {
      const result = schema.safeParse({ ...validValues(), dueDate });
      expect(result.success).toBe(false);
    }
  });

  it('accepts and trims a complete future condition', () => {
    expect(
      schema.parse({
        ...validValues(),
        name: '  MTR  ',
        responsibleAgency: '  FEPAM  ',
      })
    ).toEqual({
      ...validValues(),
      name: 'MTR',
      responsibleAgency: 'FEPAM',
    });
  });
});

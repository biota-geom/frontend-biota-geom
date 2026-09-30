import { describe, expect, it } from 'vitest';
import {
  CREATE_LICENSE_DEFAULT_VALUES,
  createLicenseSchema,
  EMPTY_CONDITION_ROW,
  FILE_TOO_LARGE_MESSAGE,
  INVALID_DATE_RANGE_MESSAGE,
  INVALID_FILE_TYPE_MESSAGE,
  MAX_FILE_SIZE_BYTES,
  toUtcIsoDate,
} from '../../features/licenses/createLicenseValidation';

const pdf = new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' });

const VALID = {
  ...CREATE_LICENSE_DEFAULT_VALUES,
  type: 'LO',
  processNumber: 'LO nº 118/2020',
  issuingAgencyId: 'agency-1',
  issueDate: '2024-03-12',
  expirationDate: '2026-03-12',
  file: pdf,
};

function messages(input: unknown) {
  const result = createLicenseSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.message);
}

describe('createLicenseSchema', () => {
  it('accepts a license without conditions', () => {
    expect(createLicenseSchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects an expiration date that is not after the issue date', () => {
    expect(messages({ ...VALID, expirationDate: VALID.issueDate })).toContain(
      INVALID_DATE_RANGE_MESSAGE
    );
  });

  it('rejects a non-PDF file', () => {
    const jpg = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    expect(messages({ ...VALID, file: jpg })).toContain(
      INVALID_FILE_TYPE_MESSAGE
    );
  });

  it('rejects a PDF above 5MB', () => {
    const big = new File([new Uint8Array(MAX_FILE_SIZE_BYTES + 1)], 'a.pdf', {
      type: 'application/pdf',
    });
    expect(messages({ ...VALID, file: big })).toContain(FILE_TOO_LARGE_MESSAGE);
  });

  it('rejects an empty condition row and accepts a filled one', () => {
    expect(
      createLicenseSchema.safeParse({
        ...VALID,
        conditions: [{ ...EMPTY_CONDITION_ROW }],
      }).success
    ).toBe(false);

    expect(
      createLicenseSchema.safeParse({
        ...VALID,
        conditions: [
          {
            itemNumber: '1.1',
            description: 'Manter controle',
            conditionType: 'Periódico',
            periodicity: 'Semestral',
            deadline: '2026-10-30',
            responsibleName: 'Lucas Silva',
          },
        ],
      }).success
    ).toBe(true);
  });
});

describe('toUtcIsoDate', () => {
  it('converts a date input value to UTC midnight', () => {
    expect(toUtcIsoDate('2026-10-30')).toBe('2026-10-30T00:00:00.000Z');
  });
});

import { describe, expect, it } from 'vitest';
import {
  isSameLegislation,
  legislationIdentityKey,
} from '../../features/legislation/legislationIdentity';
import type { LegislationInput } from '../../features/legislation/types';

const ACT: LegislationInput = {
  type: 'LEI',
  number: '12.305',
  year: 2010,
  issuingBody: 'Governo Federal',
  summary: 'Institui a PNRS.',
};

describe('legislationIdentity', () => {
  it('ignores the summary, case and surrounding spaces', () => {
    expect(
      isSameLegislation(ACT, {
        ...ACT,
        issuingBody: ' governo federal ',
        summary: null,
      })
    ).toBe(true);
  });

  it.each([
    ['type', { type: 'DECRETO' as const }],
    ['number', { number: '12.306' }],
    ['year', { year: 2011 }],
    ['issuing body', { issuingBody: 'CONAMA' }],
  ])('tells acts apart by %s', (_field, change) => {
    expect(isSameLegislation(ACT, { ...ACT, ...change })).toBe(false);
  });

  it('builds a stable key', () => {
    expect(legislationIdentityKey(ACT)).toBe('lei|12.305|2010|governo federal');
  });
});

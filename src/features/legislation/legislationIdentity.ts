import type { LegislationInput } from './types';

/**
 * What makes two acts the same one, as the backend's catalog sees it: type,
 * number, year and issuing body. Case and surrounding spaces don't count.
 */
export function legislationIdentityKey({
  issuingBody,
  number,
  type,
  year,
}: LegislationInput): string {
  return [type, number, year, issuingBody]
    .map((part) => String(part).trim().toLocaleLowerCase('pt-BR'))
    .join('|');
}

export function isSameLegislation(
  first: LegislationInput,
  second: LegislationInput
): boolean {
  return legislationIdentityKey(first) === legislationIdentityKey(second);
}

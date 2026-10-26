import {
  CONDITION_PERIODICITIES,
  CONDITION_TYPES,
  type LicenseConditionRow,
  type SuggestedConditionRow,
} from './createLicenseValidation';
import type { IssuingAgency, SuggestedCondition } from './types';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
}

function containsWords(text: string, words: string): boolean {
  return ` ${text} `.includes(` ${words} `);
}

/**
 * Finds the registered agency the AI identified by name or acronym. Returns
 * null whenever the match is not unique, so an ambiguous reading is never
 * auto-selected — the user picks the agency manually instead.
 *
 * Exact matches (acronym or full name) win; only when there is none does it
 * fall back to one containing the other, e.g. "FEPAM - Fundação Estadual..."
 * or a name followed by the agency's honoree.
 */
export function matchIssuingAgency(
  identified: string | null,
  agencies: IssuingAgency[]
): string | null {
  const target = identified ? normalize(identified) : '';
  if (!target) return null;

  const keysOf = (agency: IssuingAgency) =>
    [agency.acronym, agency.name]
      .filter((key): key is string => Boolean(key))
      .map(normalize)
      .filter(Boolean);

  const exact = agencies.filter((agency) => keysOf(agency).includes(target));
  if (exact.length > 0) return exact.length === 1 ? exact[0].id : null;

  const partial = agencies.filter((agency) =>
    keysOf(agency).some(
      (key) => containsWords(target, key) || containsWords(key, target)
    )
  );

  return partial.length === 1 ? partial[0].id : null;
}

function oneOf<T extends string>(
  value: string | null,
  allowed: readonly T[]
): T | '' {
  return value && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : '';
}

/**
 * Turns an AI suggestion into an editable, unselected form row. Anything the
 * document did not state stays empty for the user to complete.
 */
export function toSuggestedConditionRow(
  suggestion: SuggestedCondition
): SuggestedConditionRow {
  const conditionType = oneOf(suggestion.conditionType, CONDITION_TYPES);

  return {
    selected: false,
    environmentalDescriptor: suggestion.environmentalDescriptor ?? '',
    description: suggestion.description,
    conditionType,
    periodicity:
      conditionType === 'PERIODIC'
        ? oneOf(suggestion.periodicity, CONDITION_PERIODICITIES)
        : '',
    deadline: suggestion.dueDate ?? '',
    responsibleName: '',
    hasDelivery: true,
  };
}

/** The ticked suggestions, in the shape the existing conditions batch uses. */
export function selectedSuggestedConditions(
  rows: SuggestedConditionRow[]
): LicenseConditionRow[] {
  return rows
    .filter((row) => row.selected)
    .map((row) => ({
      environmentalDescriptor: row.environmentalDescriptor,
      description: row.description,
      conditionType: row.conditionType,
      periodicity: row.periodicity,
      deadline: row.deadline,
      responsibleName: row.responsibleName,
      hasDelivery: row.hasDelivery,
    }));
}

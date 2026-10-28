import {
  CONDITION_PERIODICITIES,
  CONDITION_TYPES,
  type LicenseConditionRow,
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
 * Turns an AI suggestion into a condition row of the form. Anything the
 * document did not state stays empty, so the row is flagged as pending in the
 * conditions table until the user completes it with the edit button.
 */
export function toLicenseConditionRow(
  suggestion: SuggestedCondition
): LicenseConditionRow {
  const conditionType = oneOf(suggestion.conditionType, CONDITION_TYPES);

  return {
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

/**
 * Appends the suggestions to the conditions already in the form, skipping
 * any whose description is already there — re-selecting the same PDF must
 * not duplicate rows nor replace ones the user has edited.
 */
export function mergeSuggestedConditions(
  current: LicenseConditionRow[],
  suggestions: SuggestedCondition[]
): LicenseConditionRow[] {
  const known = new Set(current.map((row) => normalize(row.description)));
  const added: LicenseConditionRow[] = [];

  for (const suggestion of suggestions) {
    const key = normalize(suggestion.description);
    if (known.has(key)) continue;
    known.add(key);
    added.push(toLicenseConditionRow(suggestion));
  }

  return [...current, ...added];
}

import {
  CONDITION_PERIODICITIES,
  CONDITION_TYPES,
  type LicenseConditionRow,
} from './createLicenseValidation';
import type { SuggestedCondition } from './types';

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();
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
 * any whose description was already there before this reading — re-selecting
 * the same PDF must not duplicate rows nor replace ones the user has edited.
 *
 * Repeats inside one reading are kept: licenses often state the same
 * obligation under different item numbers, and each one is a condition.
 */
export function mergeSuggestedConditions(
  current: LicenseConditionRow[],
  suggestions: SuggestedCondition[]
): LicenseConditionRow[] {
  const known = new Set(current.map((row) => normalize(row.description)));
  const added = suggestions
    .filter((suggestion) => !known.has(normalize(suggestion.description)))
    .map(toLicenseConditionRow);

  return [...current, ...added];
}

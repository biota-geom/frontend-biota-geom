import type { LicenseConditionDetail } from './types';

export type ActionableCondition = LicenseConditionDetail & { id: string };

/*
 * Environmental descriptor rows (isEnvironmentalDescriptor === true) have
 * id === null and represent section headers, not actionable conditions. Only
 * real conditions, with a stable string id, can be fulfilled or copied.
 */
export function getActionableConditions(
  conditions: LicenseConditionDetail[]
): ActionableCondition[] {
  return conditions.filter(
    (condition): condition is ActionableCondition =>
      !condition.isEnvironmentalDescriptor && condition.id !== null
  );
}

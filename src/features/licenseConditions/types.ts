export type LicenseConditionRiskLevel = 'REGULAR' | 'ATTENTION' | 'RISK';

export interface LicenseCondition {
  id: string;
  licenseId: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  riskLevel: LicenseConditionRiskLevel;
}

/**
 * The risk level shown as "Status" in the edit form. It is computed by the API
 * from the due date on every read, so the form displays it and never sends it
 * back — the same rule the license status follows.
 */
export const RISK_LEVEL_LABELS: Record<LicenseConditionRiskLevel, string> = {
  REGULAR: 'Regular',
  ATTENTION: 'Atenção',
  RISK: 'Risco',
};

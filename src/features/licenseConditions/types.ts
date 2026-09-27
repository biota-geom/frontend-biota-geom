export type LicenseConditionRiskLevel = 'REGULAR' | 'ATTENTION' | 'RISK';

export interface LicenseCondition {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  riskLevel: LicenseConditionRiskLevel;
}

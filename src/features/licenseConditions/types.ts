export type LicenseConditionRiskLevel = 'REGULAR' | 'ATTENTION' | 'RISK';

export type LicenseConditionStatusFilter = 'all' | LicenseConditionRiskLevel;

export interface LicenseCondition {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  riskLevel: LicenseConditionRiskLevel;
}

export interface LicenseConditionsResult {
  conditions: LicenseCondition[];
  total: number;
}

export type LicenseConditionRiskLevel = 'REGULAR' | 'ATTENTION' | 'RISK';
export type LicenseConditionStatus = 'Regular' | 'Atenção' | 'Risco';

export type LicenseConditionStatusFilter = 'all' | LicenseConditionRiskLevel;

/** GRI parameter (US02) of the company the condition is categorized under. */
export interface LicenseConditionCategory {
  id: string;
  name: string;
}

export interface LicenseCondition {
  id: string;
  licenseId: string;
  name: string;
  description: string | null;
  category: LicenseConditionCategory;
  responsibleAgency: string | null;
  dueDate: string;
  status: LicenseConditionStatus;
  riskLevel: LicenseConditionRiskLevel;
}

export interface LicenseConditionsCompliance {
  totalActive: number;
  inCompliance: number;
  compliancePercentage: number;
}

export interface LicenseConditionsResult {
  conditions: LicenseCondition[];
  total: number;
}

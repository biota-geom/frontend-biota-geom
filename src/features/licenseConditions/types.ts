export type LicenseConditionRiskLevel = 'REGULAR' | 'ATTENTION' | 'RISK';
export type LicenseConditionStatus = 'Regular' | 'Atenção' | 'Risco';

export type LicenseConditionStatusFilter = 'all' | LicenseConditionRiskLevel;

export interface LicenseCondition {
  id: string;
  licenseId: string;
  name: string;
  description: string | null;
  category: string;
  responsibleAgency: string | null;
  dueDate: string;
  status: LicenseConditionStatus;
  riskLevel: LicenseConditionRiskLevel;
}

export interface LicenseConditionsResult {
  conditions: LicenseCondition[];
  total: number;
}

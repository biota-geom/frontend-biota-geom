export type LicenseConditionRiskLevel = 'REGULAR' | 'ATTENTION' | 'RISK';
export type LicenseConditionStatus = 'Regular' | 'Atenção' | 'Risco';

export type LicenseConditionStatusFilter = 'all' | LicenseConditionRiskLevel;

export interface LicenseCondition {
  id: string;
  licenseId: string;
  parentConditionId?: string | null;
  name: string;
  description: string | null;
  environmentalDescriptor: string;
  responsibleAgency: string | null;
  dueDate: string;
  alertDate: string | null;
  status: LicenseConditionStatus;
  hasDelivery: boolean;
  isViolated: boolean;
  riskLevel: LicenseConditionRiskLevel;
  conditionStatus?: string | null;
  completionDate?: string | null;
  isFulfilled?: boolean;
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

import type {
  LicenseCondition,
  LicenseConditionsCompliance,
  LicenseConditionsResult,
  LicenseConditionStatus,
  LicenseConditionStatusFilter,
} from '../../features/licenseConditions/types';
import { request } from './http';
import type {
  LicenseConditionCreatedWire,
  LicenseConditionWire,
  LicenseConditionsComplianceWire,
  LicenseConditionsResponseWire,
} from './types';

export interface CreateLicenseConditionInput {
  name: string;
  esgMetricId: string;
  licenseId: string;
  responsibleAgency: string;
  dueDate: string;
  status: LicenseConditionStatus;
  description?: string;
}

function toLicenseCondition(wire: LicenseConditionWire): LicenseCondition {
  return {
    id: wire.id,
    licenseId: wire.license_id,
    name: wire.name,
    description: wire.description,
    category: { id: wire.category.id, name: wire.category.name },
    responsibleAgency: wire.responsible_agency,
    dueDate: wire.due_date,
    status: wire.status,
    riskLevel: wire.risk_level,
  };
}

export async function listLicenseConditions(
  customerId: string,
  status: LicenseConditionStatusFilter
): Promise<LicenseConditionsResult> {
  const query =
    status === 'all' ? '' : `?${new URLSearchParams({ status }).toString()}`;
  const wire = await request<LicenseConditionsResponseWire>(
    `/api/customers/${customerId}/license-conditions${query}`
  );

  return {
    conditions: wire.data.map(toLicenseCondition),
    total: wire.total,
  };
}

export async function getLicenseConditionsCompliance(
  customerId: string
): Promise<LicenseConditionsCompliance> {
  const wire = await request<LicenseConditionsComplianceWire>(
    `/api/customers/${customerId}/license-conditions/compliance`
  );

  return {
    totalActive: wire.total_active,
    inCompliance: wire.in_compliance,
    compliancePercentage: wire.compliance_percentage,
  };
}

export async function createLicenseCondition(
  input: CreateLicenseConditionInput
): Promise<LicenseConditionCreatedWire> {
  return request<LicenseConditionCreatedWire>(
    `/api/licenses/${input.licenseId}/conditions`,
    {
      method: 'POST',
      body: {
        name: input.name,
        esg_metric_id: input.esgMetricId,
        license_id: input.licenseId,
        responsible_agency: input.responsibleAgency,
        due_date: input.dueDate,
        status: input.status,
        ...(input.description ? { description: input.description } : {}),
      },
    }
  );
}

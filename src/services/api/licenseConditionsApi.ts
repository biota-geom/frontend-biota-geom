import type { LicenseCondition } from '../../features/licenseConditions/types';
import type { LicenseConditionStatus } from '../../features/licenseConditions/types';
import { request } from './http';
import type {
  LicenseConditionCreatedWire,
  LicenseConditionWire,
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
  customerId: string
): Promise<LicenseCondition[]> {
  const wire = await request<LicenseConditionWire[]>(
    `/api/customers/${customerId}/license-conditions`
  );

  return wire.map(toLicenseCondition);
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

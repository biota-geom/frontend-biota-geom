import type {
  LicenseCondition,
  LicenseConditionsResult,
  LicenseConditionStatus,
  LicenseConditionStatusFilter,
} from '../../features/licenseConditions/types';
import { request } from './http';
import type {
  LicenseConditionCreatedWire,
  LicenseConditionWire,
  LicenseConditionsResponseWire,
} from './types';

export interface CreateLicenseConditionInput {
  name: string;
  category: string;
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
    category: wire.category,
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

export async function createLicenseCondition(
  input: CreateLicenseConditionInput
): Promise<LicenseConditionCreatedWire> {
  return request<LicenseConditionCreatedWire>(
    `/api/licenses/${input.licenseId}/conditions`,
    {
      method: 'POST',
      body: {
        name: input.name,
        category: input.category,
        license_id: input.licenseId,
        responsible_agency: input.responsibleAgency,
        due_date: input.dueDate,
        status: input.status,
        ...(input.description ? { description: input.description } : {}),
      },
    }
  );
}

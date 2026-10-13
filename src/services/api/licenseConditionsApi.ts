import type {
  LicenseCondition,
  LicenseConditionsCompliance,
  LicenseConditionsResult,
  LicenseConditionStatus,
  LicenseConditionStatusFilter,
} from '../../features/licenseConditions/types';
import { request } from './http';
import type {
  CreateLicenseConditionsRequestWire,
  LicenseConditionCreatedWire,
  LicenseConditionWire,
  LicenseConditionsComplianceWire,
  LicenseConditionsResponseWire,
  SaveConditionsFulfillmentRequestWire,
} from './types';
import type { ConditionFulfillmentItem } from '../../features/licenses/types';

export interface LicenseConditionBatchItemInput {
  environmentalDescriptor: string;
  description: string;
  conditionType: string;
  periodicity?: string;
  deadline: string;
  responsibleName: string;
  hasDelivery: boolean;
}

export interface CreateLicenseConditionInput {
  name: string;
  environmentalDescriptor: string;
  licenseId: string;
  responsibleAgency: string;
  dueDate: string;
  status: LicenseConditionStatus;
  hasDelivery: boolean;
  description?: string;
}

export interface UpdateLicenseConditionInput {
  name: string;
  environmentalDescriptor: string;
  responsibleAgency?: string;
  dueDate: string;
  hasDelivery: boolean;
  isViolated: boolean;
  description?: string;
}

function toLicenseCondition(wire: LicenseConditionWire): LicenseCondition {
  return {
    id: wire.id,
    licenseId: wire.license_id,
    name: wire.name,
    description: wire.description,
    environmentalDescriptor: wire.environmental_descriptor,
    responsibleAgency: wire.responsible_agency,
    dueDate: wire.due_date,
    status: wire.status,
    hasDelivery: wire.has_delivery,
    isViolated: wire.is_violated,
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
        environmental_descriptor: input.environmentalDescriptor,
        license_id: input.licenseId,
        responsible_agency: input.responsibleAgency,
        due_date: input.dueDate,
        status: input.status,
        has_delivery: input.hasDelivery,
        ...(input.description ? { description: input.description } : {}),
      },
    }
  );
}

export async function updateLicenseCondition(
  conditionId: string,
  input: UpdateLicenseConditionInput
): Promise<void> {
  await request<unknown>(`/api/license-conditions/${conditionId}`, {
    method: 'PUT',
    body: {
      name: input.name,
      environmental_descriptor: input.environmentalDescriptor,
      responsible_agency: input.responsibleAgency,
      due_date: input.dueDate,
      has_delivery: input.hasDelivery,
      is_violated: input.isViolated,
      description: input.description,
    },
  });
}

export async function createLicenseConditions(
  customerId: string,
  licenseId: string,
  conditions: LicenseConditionBatchItemInput[]
): Promise<void> {
  const body: CreateLicenseConditionsRequestWire = {
    conditions: conditions.map((condition) => ({
      environmental_descriptor: condition.environmentalDescriptor,
      description: condition.description,
      condition_type: condition.conditionType,
      ...(condition.periodicity ? { periodicity: condition.periodicity } : {}),
      deadline: condition.deadline,
      responsible_name: condition.responsibleName,
      has_delivery: condition.hasDelivery,
    })),
  };

  await request<unknown>(
    `/api/customers/${customerId}/licenses/${licenseId}/conditions`,
    {
      method: 'POST',
      body,
    }
  );
}

export async function saveConditionsFulfillment(
  customerId: string,
  licenseId: string,
  items: ConditionFulfillmentItem[]
): Promise<void> {
  const body: SaveConditionsFulfillmentRequestWire = {
    items: items.map((item) => ({
      condition_id: item.conditionId,
      fulfilled: item.fulfilled,
    })),
  };

  await request<unknown>(
    `/api/customers/${customerId}/licenses/${licenseId}/conditions/fulfillment`,
    { method: 'PATCH', body }
  );
}

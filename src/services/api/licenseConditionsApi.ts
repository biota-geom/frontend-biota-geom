import type {
  LicenseCondition,
  LicenseConditionsResult,
  LicenseConditionStatusFilter,
} from '../../features/licenseConditions/types';
import { request } from './http';
import type {
  LicenseConditionWire,
  LicenseConditionsResponseWire,
} from './types';

function toLicenseCondition(wire: LicenseConditionWire): LicenseCondition {
  return {
    id: wire.id,
    title: wire.title,
    description: wire.description,
    category: wire.category,
    dueDate: wire.due_date,
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

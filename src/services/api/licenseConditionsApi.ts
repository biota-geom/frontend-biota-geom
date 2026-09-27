import type { LicenseCondition } from '../../features/licenseConditions/types';
import { request } from './http';
import type { LicenseConditionWire } from './types';

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
  customerId: string
): Promise<LicenseCondition[]> {
  const wire = await request<LicenseConditionWire[]>(
    `/api/customers/${customerId}/license-conditions`
  );

  return wire.map(toLicenseCondition);
}

import type { LicenseCondition } from '../../features/licenseConditions/types';
import { request } from './http';
import type { LicenseConditionWire } from './types';

export interface UpdateLicenseConditionInput {
  licenseId: string;
  title: string;
  description: string;
  category: string;
  /** `YYYY-MM-DD`, straight from an `<input type="date">`. */
  dueDate: string;
}

function toLicenseCondition(wire: LicenseConditionWire): LicenseCondition {
  return {
    id: wire.id,
    licenseId: wire.license_id,
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

export async function updateLicenseCondition(
  customerId: string,
  conditionId: string,
  input: UpdateLicenseConditionInput
): Promise<LicenseCondition> {
  const wire = await request<LicenseConditionWire>(
    `/api/customers/${customerId}/license-conditions/${conditionId}`,
    {
      method: 'PUT',
      body: {
        title: input.title,
        description: input.description,
        category: input.category,
        license_id: input.licenseId,
        /*
         * The date input yields a calendar day with no time zone; the API
         * stores an instant. Pinning it to UTC midnight is what the listing
         * assumes when it formats the due date back (see ConditionCard).
         */
        due_date: `${input.dueDate}T00:00:00.000Z`,
      },
    }
  );

  return toLicenseCondition(wire);
}

export async function deleteLicenseCondition(
  customerId: string,
  conditionId: string
): Promise<void> {
  await request<void>(
    `/api/customers/${customerId}/license-conditions/${conditionId}`,
    { method: 'DELETE' }
  );
}

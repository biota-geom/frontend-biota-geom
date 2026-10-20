import type {
  EsgIndicatorsPayload,
  EsgMonthlyIndicators,
} from '../../features/esgIndicators/types';
import { request } from './http';
import type { EsgIndicatorsWire } from './types';

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getEsgIndicators(
  customerId: string,
  month: string
): Promise<EsgMonthlyIndicators> {
  const wire = await request<EsgIndicatorsWire | undefined>(
    `/api/customers/${customerId}/esg-indicators/${month}`
  );

  return {
    water: toNullableNumber(wire?.water),
    waste: toNullableNumber(wire?.waste),
    employees: toNullableNumber(wire?.employees),
    energy: toNullableNumber(wire?.energy),
  };
}

export async function saveEsgIndicators(
  customerId: string,
  month: string,
  indicators: EsgIndicatorsPayload
): Promise<void> {
  await request<unknown>(
    `/api/customers/${customerId}/esg-indicators/${month}`,
    {
      method: 'PUT',
      body: indicators,
    }
  );
}

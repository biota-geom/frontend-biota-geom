import type { MonthlyIndicator } from '../../features/esgIndicators/types';
import { request } from './http';
import type {
  CreateCustomerIndicatorWire,
  MonthlyIndicatorWire,
  SaveEsgIndicatorsWire,
} from './types';

export async function getEsgIndicators(
  customerId: string,
  month: string
): Promise<MonthlyIndicator[]> {
  const wire = await request<MonthlyIndicatorWire[]>(
    `/api/customers/${customerId}/esg-indicators/${month}`
  );

  // Defensive: if the response is not an array (e.g. empty body), return [].
  if (!Array.isArray(wire)) return [];

  return wire.map((item) => ({
    indicator_id: item.indicator_id,
    name: item.name,
    unit: item.unit,
    category: item.category,
    value: item.value ?? null,
  }));
}

export async function saveEsgIndicators(
  customerId: string,
  month: string,
  payload: SaveEsgIndicatorsWire
): Promise<MonthlyIndicator[]> {
  const wire = await request<MonthlyIndicatorWire[]>(
    `/api/customers/${customerId}/esg-indicators/${month}`,
    {
      method: 'PUT',
      body: payload,
    }
  );

  if (!Array.isArray(wire)) return [];

  return wire.map((item) => ({
    indicator_id: item.indicator_id,
    name: item.name,
    unit: item.unit,
    category: item.category,
    value: item.value ?? null,
  }));
}

export async function createCustomerIndicator(
  customerId: string,
  data: CreateCustomerIndicatorWire
): Promise<MonthlyIndicator> {
  const item = await request<MonthlyIndicatorWire>(
    `/api/customers/${customerId}/indicators`,
    {
      method: 'POST',
      body: data,
    }
  );

  return {
    indicator_id: item.indicator_id,
    name: item.name,
    unit: item.unit,
    category: item.category,
    value: item.value ?? null,
  };
}

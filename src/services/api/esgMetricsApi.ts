import type { EsgIndicator } from '../../features/companies/types';
import { request } from './http';
import type { CreateEsgMetricRequestWire, EsgMetricWire } from './types';

function toEsgIndicator(wire: EsgMetricWire): EsgIndicator {
  return {
    id: wire.id,
    name: wire.name,
    unit: wire.unit,
  };
}

/** Returns the global catalog plus the metrics owned by the signed-in account. */
export async function listEsgMetrics(): Promise<EsgIndicator[]> {
  const wire = await request<EsgMetricWire[]>('/api/esg-metrics');
  return wire.map(toEsgIndicator);
}

export async function createEsgMetric(
  input: CreateEsgMetricRequestWire
): Promise<EsgIndicator> {
  const wire = await request<EsgMetricWire>('/api/esg-metrics', {
    method: 'POST',
    body: input,
  });

  return toEsgIndicator(wire);
}

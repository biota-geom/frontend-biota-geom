import type { EsgIndicator } from '../../features/companies/esgIndicators.mock';
import { request } from './http';
import type { CreateEsgMetricRequestWire, EsgMetricWire } from './types';

function toEsgIndicator(wire: EsgMetricWire): EsgIndicator {
  return {
    id: wire.id,
    name: wire.name,
    unit: wire.unit,
  };
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

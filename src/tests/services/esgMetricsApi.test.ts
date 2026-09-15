import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { createEsgMetric, listEsgMetrics } =
  await import('../../services/api/esgMetricsApi');

describe('esgMetricsApi', () => {
  it('createEsgMetric() posts to /api/esg-metrics and maps the response to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'metric-1',
      name: 'Consumo de Água',
      unit: 'm³',
      pillar: 'AMBIENTAL',
      customer_id: 'customer-1',
      gri_standard_id: null,
    });

    const result = await createEsgMetric({
      name: 'Consumo de Água',
      unit: 'm³',
      pillar: 'AMBIENTAL',
    });

    expect(request).toHaveBeenCalledWith('/api/esg-metrics', {
      method: 'POST',
      body: {
        name: 'Consumo de Água',
        unit: 'm³',
        pillar: 'AMBIENTAL',
      },
    });
    expect(result).toEqual({
      id: 'metric-1',
      name: 'Consumo de Água',
      unit: 'm³',
    });
  });

  it('listEsgMetrics() fetches /api/esg-metrics and keeps only the fields the UI shows', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'metric-1',
        name: 'Consumo de Água',
        unit: 'm³',
        pillar: 'AMBIENTAL',
        customer_id: null,
        gri_standard_id: null,
      },
      {
        id: 'metric-2',
        name: 'Rotatividade de Pessoal',
        unit: '%',
        pillar: 'SOCIAL',
        customer_id: 'customer-1',
        gri_standard_id: 'gri-401',
      },
    ]);

    const metrics = await listEsgMetrics();

    expect(request).toHaveBeenCalledWith('/api/esg-metrics');
    expect(metrics).toEqual([
      { id: 'metric-1', name: 'Consumo de Água', unit: 'm³' },
      { id: 'metric-2', name: 'Rotatividade de Pessoal', unit: '%' },
    ]);
  });
});

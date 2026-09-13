import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { createEsgMetric } = await import('../../services/api/esgMetricsApi');

describe('esgMetricsApi', () => {
  it('createEsgMetric() posts to /api/esg-metrics and maps the response to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'metric-1',
      name: 'Consumo de Água',
      unit: 'm³',
      pillar: 'AMBIENTAL',
      client_id: 'user-1',
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
});

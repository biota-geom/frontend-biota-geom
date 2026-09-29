import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { listLicenseConditions } =
  await import('../../services/api/licenseConditionsApi');

describe('licenseConditionsApi', () => {
  it('fetches all customer conditions and maps the response', async () => {
    vi.mocked(request).mockResolvedValue({
      total: 1,
      data: [
        {
          id: 'condition-1',
          title: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          category: 'Emissões',
          due_date: '2026-02-11T00:00:00.000Z',
          risk_level: 'RISK',
        },
      ],
    });

    const result = await listLicenseConditions('customer-1', 'all');

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/license-conditions'
    );
    expect(result).toEqual({
      total: 1,
      conditions: [
        {
          id: 'condition-1',
          title: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          category: 'Emissões',
          dueDate: '2026-02-11T00:00:00.000Z',
          riskLevel: 'RISK',
        },
      ],
    });
  });

  it('adds the selected risk status to the query string', async () => {
    vi.mocked(request).mockResolvedValue({ total: 0, data: [] });

    await listLicenseConditions('customer-1', 'RISK');

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/license-conditions?status=RISK'
    );
  });
});

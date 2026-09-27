import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { listLicenseConditions } =
  await import('../../services/api/licenseConditionsApi');

describe('licenseConditionsApi', () => {
  it('listLicenseConditions() fetches the customer-scoped endpoint and maps the wire shape', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'condition-1',
        title: 'Automonitoramento Atmosférico',
        description: 'Avaliação periódica de emissões.',
        category: 'Emissões',
        due_date: '2026-02-11T00:00:00.000Z',
        risk_level: 'RISK',
      },
    ]);

    const conditions = await listLicenseConditions('customer-1');

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/license-conditions'
    );
    expect(conditions).toEqual([
      {
        id: 'condition-1',
        title: 'Automonitoramento Atmosférico',
        description: 'Avaliação periódica de emissões.',
        category: 'Emissões',
        dueDate: '2026-02-11T00:00:00.000Z',
        riskLevel: 'RISK',
      },
    ]);
  });
});

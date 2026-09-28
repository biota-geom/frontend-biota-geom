import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  listLicenseConditions,
  updateLicenseCondition,
  deleteLicenseCondition,
} = await import('../../services/api/licenseConditionsApi');

describe('licenseConditionsApi', () => {
  it('listLicenseConditions() fetches the customer-scoped endpoint and maps the wire shape', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'condition-1',
        title: 'Automonitoramento Atmosférico',
        description: 'Avaliação periódica de emissões.',
        category: 'Emissões',
        license_id: 'license-1',
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
        licenseId: 'license-1',
        title: 'Automonitoramento Atmosférico',
        description: 'Avaliação periódica de emissões.',
        category: 'Emissões',
        dueDate: '2026-02-11T00:00:00.000Z',
        riskLevel: 'RISK',
      },
    ]);
  });

  it('updateLicenseCondition() PUTs the snake_case body and maps the response back', async () => {
    vi.mocked(request).mockResolvedValue({
      id: 'condition-1',
      title: 'MTR - Manifesto de Transporte de Resíduos',
      description: 'Emissão de manifesto obrigatório.',
      category: 'Resíduos',
      license_id: 'license-2',
      due_date: '2026-06-30T00:00:00.000Z',
      risk_level: 'REGULAR',
    });

    const condition = await updateLicenseCondition(
      'customer-1',
      'condition-1',
      {
        title: 'MTR - Manifesto de Transporte de Resíduos',
        description: 'Emissão de manifesto obrigatório.',
        category: 'Resíduos',
        licenseId: 'license-2',
        dueDate: '2026-06-30',
      }
    );

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/license-conditions/condition-1',
      {
        method: 'PUT',
        body: {
          title: 'MTR - Manifesto de Transporte de Resíduos',
          description: 'Emissão de manifesto obrigatório.',
          category: 'Resíduos',
          license_id: 'license-2',
          due_date: '2026-06-30T00:00:00.000Z',
        },
      }
    );
    expect(condition).toEqual({
      id: 'condition-1',
      licenseId: 'license-2',
      title: 'MTR - Manifesto de Transporte de Resíduos',
      description: 'Emissão de manifesto obrigatório.',
      category: 'Resíduos',
      dueDate: '2026-06-30T00:00:00.000Z',
      riskLevel: 'REGULAR',
    });
  });

  it('deleteLicenseCondition() DELETEs the condition-scoped endpoint', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await expect(
      deleteLicenseCondition('customer-1', 'condition-1')
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/license-conditions/condition-1',
      { method: 'DELETE' }
    );
  });
});

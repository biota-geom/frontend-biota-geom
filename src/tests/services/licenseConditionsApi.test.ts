import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  createLicenseCondition,
  createLicenseConditions,
  listLicenseConditions,
} = await import('../../services/api/licenseConditionsApi');

describe('licenseConditionsApi', () => {
  it('fetches all customer conditions and maps the response', async () => {
    vi.mocked(request).mockResolvedValue({
      total: 1,
      data: [
        {
          id: 'condition-1',
          license_id: 'license-1',
          name: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          category: 'Emissões',
          responsible_agency: 'FEPAM',
          due_date: '2026-02-11T00:00:00.000Z',
          status: 'Regular',
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
          licenseId: 'license-1',
          name: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          category: 'Emissões',
          responsibleAgency: 'FEPAM',
          dueDate: '2026-02-11T00:00:00.000Z',
          status: 'Regular',
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

  it('createLicenseCondition() posts the selected license and snake_case contract', async () => {
    const response = {
      id: 'condition-1',
      license_id: 'license-1',
      name: 'MTR',
      description: null,
      category: 'Resíduos',
      responsible_agency: 'FEPAM',
      due_date: '2027-05-20T00:00:00.000Z',
      status: 'Regular' as const,
      created_at: '2026-09-29T12:00:00.000Z',
    };
    vi.mocked(request).mockResolvedValue(response);

    await expect(
      createLicenseCondition({
        name: 'MTR',
        category: 'Resíduos',
        licenseId: 'license-1',
        responsibleAgency: 'FEPAM',
        dueDate: '2027-05-20T00:00:00.000Z',
        status: 'Regular',
      })
    ).resolves.toEqual(response);
    expect(request).toHaveBeenCalledWith('/api/licenses/license-1/conditions', {
      method: 'POST',
      body: {
        name: 'MTR',
        category: 'Resíduos',
        license_id: 'license-1',
        responsible_agency: 'FEPAM',
        due_date: '2027-05-20T00:00:00.000Z',
        status: 'Regular',
      },
    });
  });

  it('createLicenseConditions() posts the batch contract in snake_case', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await createLicenseConditions('license-1', [
      {
        itemNumber: '1.1',
        description: 'Apresentar laudos semestrais',
        conditionType: 'Periódico',
        periodicity: 'Semestral',
        deadline: '2025-12-15T00:00:00.000Z',
        responsibleName: 'Julia Costa',
      },
    ]);

    expect(request).toHaveBeenCalledWith('/api/licenses/license-1/conditions', {
      method: 'POST',
      body: {
        conditions: [
          {
            item_number: '1.1',
            description: 'Apresentar laudos semestrais',
            condition_type: 'Periódico',
            periodicity: 'Semestral',
            deadline: '2025-12-15T00:00:00.000Z',
            responsible_name: 'Julia Costa',
          },
        ],
      },
    });
  });
});

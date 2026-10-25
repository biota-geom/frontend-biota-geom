import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  createLicenseCondition,
  createLicenseConditions,
  deleteLicenseCondition,
  getLicenseConditionsCompliance,
  listLicenseConditions,
  updateLicenseCondition,
} = await import('../../services/api/licenseConditionsApi');

describe('licenseConditionsApi', () => {
  it('fetches the customer compliance summary', async () => {
    vi.mocked(request).mockResolvedValue({
      total_active: 8,
      in_compliance: 4,
      compliance_percentage: 50,
    });

    await expect(getLicenseConditionsCompliance('customer-1')).resolves.toEqual(
      {
        totalActive: 8,
        inCompliance: 4,
        compliancePercentage: 50,
      }
    );
  });

  it('maps monitor conditions with descriptor and violation fields', async () => {
    vi.mocked(request).mockResolvedValue({
      total: 1,
      data: [
        {
          id: 'condition-1',
          license_id: 'license-1',
          name: 'Automonitoramento Atmosférico',
          description: 'Avaliação periódica de emissões.',
          environmental_descriptor: 'Emissões',
          responsible_agency: 'FEPAM',
          due_date: '2026-02-11T00:00:00.000Z',
          status: 'Regular',
          has_delivery: true,
          is_violated: true,
          risk_level: 'RISK',
        },
      ],
    });

    await expect(listLicenseConditions('customer-1', 'all')).resolves.toEqual({
      total: 1,
      conditions: [
        expect.objectContaining({
          environmentalDescriptor: 'Emissões',
          hasDelivery: true,
          isViolated: true,
        }),
      ],
    });
  });

  it('posts the free-text descriptor and delivery flag', async () => {
    vi.mocked(request).mockResolvedValue({});

    await createLicenseCondition({
      name: 'MTR',
      environmentalDescriptor: 'Resíduos sólidos',
      licenseId: 'license-1',
      responsibleAgency: 'FEPAM',
      dueDate: '2027-05-20T00:00:00.000Z',
      status: 'Regular',
      hasDelivery: true,
    });

    expect(request).toHaveBeenCalledWith('/api/licenses/license-1/conditions', {
      method: 'POST',
      body: {
        name: 'MTR',
        environmental_descriptor: 'Resíduos sólidos',
        license_id: 'license-1',
        responsible_agency: 'FEPAM',
        due_date: '2027-05-20T00:00:00.000Z',
        status: 'Regular',
        has_delivery: true,
      },
    });
  });

  it('updates manual violation through the license-conditions route', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await updateLicenseCondition('condition-1', {
      name: 'MTR',
      environmentalDescriptor: 'Resíduos sólidos',
      dueDate: '2027-05-20T00:00:00.000Z',
      hasDelivery: false,
      isViolated: true,
    });

    expect(request).toHaveBeenCalledWith(
      '/api/license-conditions/condition-1',
      expect.objectContaining({
        method: 'PUT',
        body: expect.objectContaining({
          environmental_descriptor: 'Resíduos sólidos',
          has_delivery: false,
          is_violated: true,
        }),
      })
    );
  });

  it('posts the batch without a client-supplied item number', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await createLicenseConditions('customer-1', 'license-1', [
      {
        environmentalDescriptor: 'Resíduos sólidos',
        description: 'Apresentar laudos semestrais',
        conditionType: 'PERIODIC',
        periodicity: 'SEMIANNUAL',
        deadline: '2025-12-15T00:00:00.000Z',
        responsibleName: 'Julia Costa',
        hasDelivery: true,
      },
    ]);

    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/licenses/license-1/conditions',
      {
        method: 'POST',
        body: {
          conditions: [
            {
              environmental_descriptor: 'Resíduos sólidos',
              description: 'Apresentar laudos semestrais',
              condition_type: 'PERIODIC',
              periodicity: 'SEMIANNUAL',
              deadline: '2025-12-15T00:00:00.000Z',
              responsible_name: 'Julia Costa',
              has_delivery: true,
            },
          ],
        },
      }
    );
  });

  it('deletes a condition through the license-scoped route', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await expect(
      deleteLicenseCondition('customer-1', 'license-1', 'condition-1')
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(
      '/api/customers/customer-1/licenses/license-1/conditions/condition-1',
      { method: 'DELETE' }
    );
  });
});

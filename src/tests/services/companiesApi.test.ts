import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { getCompanyById } = await import('../../services/api/companiesApi');

describe('companiesApi', () => {
  it('gets a company by id from the customers listing', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'company-1',
        name: 'Unidade Industrial RS',
        status: 'Ativo',
        segment: 'Siderurgia',
        location: 'Porto Alegre - RS',
      },
    ]);

    const company = await getCompanyById('company-1');

    expect(request).toHaveBeenCalledWith('/customers');
    expect(company).toEqual({
      id: 'company-1',
      name: 'Unidade Industrial RS',
      status: 'active',
      segment: 'Siderurgia',
      location: 'Porto Alegre - RS',
    });
  });

  it('rejects when the company id is absent from the listing', async () => {
    vi.mocked(request).mockResolvedValue([]);

    await expect(getCompanyById('missing-company')).rejects.toMatchObject({
      status: 404,
    });
  });
});

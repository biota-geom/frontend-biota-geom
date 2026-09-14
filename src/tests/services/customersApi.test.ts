import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { listCompanies } = await import('../../services/api/customersApi');

describe('customersApi', () => {
  it('listCompanies() fetches /customers and maps status to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: 'customer-1',
        name: 'Unidade Industrial RS',
        status: 'Ativo',
        segment: 'Siderurgia',
        location: 'Porto Alegre - RS',
      },
      {
        id: 'customer-2',
        name: 'Filial SP',
        status: 'Inativo',
        segment: '',
        location: 'São Paulo - SP',
      },
    ]);

    const companies = await listCompanies();

    expect(request).toHaveBeenCalledWith('/customers');
    expect(companies).toEqual([
      {
        id: 'customer-1',
        name: 'Unidade Industrial RS',
        status: 'active',
        segment: 'Siderurgia',
        location: 'Porto Alegre - RS',
      },
      {
        id: 'customer-2',
        name: 'Filial SP',
        status: 'inactive',
        segment: '',
        location: 'São Paulo - SP',
      },
    ]);
  });
});

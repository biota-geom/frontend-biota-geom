import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/customersApi', () => ({
  listCompanies: vi.fn(),
}));

const customersApi = await import('../../services/api/customersApi');
const { useCompanies } = await import('../../features/companies/useCompanies');

const COMPANY = {
  id: 'customer-1',
  name: 'Unidade Industrial RS',
  status: 'active' as const,
  segment: 'Siderurgia',
  location: 'Porto Alegre - RS',
};

describe('useCompanies store', () => {
  beforeEach(() => {
    useCompanies.setState({ companies: [], status: 'idle', error: null });
    vi.resetAllMocks();
    vi.restoreAllMocks();
  });

  it('fetchCompanies() loads the list and marks the store successful', async () => {
    vi.mocked(customersApi.listCompanies).mockResolvedValue([COMPANY]);

    await useCompanies.getState().fetchCompanies();

    expect(useCompanies.getState().status).toBe('success');
    expect(useCompanies.getState().companies).toEqual([COMPANY]);
    expect(useCompanies.getState().error).toBeNull();
  });

  it('fetchCompanies() surfaces the API error message on failure', async () => {
    vi.mocked(customersApi.listCompanies).mockRejectedValue(
      new ApiError(500, 'Erro interno do servidor.')
    );

    await useCompanies.getState().fetchCompanies();

    expect(useCompanies.getState().status).toBe('error');
    expect(useCompanies.getState().error).toBe('Erro interno do servidor.');
    expect(useCompanies.getState().companies).toEqual([]);
  });

  it('fetchCompanies() falls back to a generic message for a non-API error', async () => {
    vi.mocked(customersApi.listCompanies).mockRejectedValue(new Error('boom'));

    await useCompanies.getState().fetchCompanies();

    expect(useCompanies.getState().status).toBe('error');
    expect(useCompanies.getState().error).toBe(
      'Não foi possível carregar as empresas cadastradas.'
    );
  });

  it('does not start a second fetch while one is already loading', async () => {
    let resolveFetch!: (value: (typeof COMPANY)[]) => void;
    vi.mocked(customersApi.listCompanies).mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const first = useCompanies.getState().fetchCompanies();
    const second = useCompanies.getState().fetchCompanies();

    resolveFetch([COMPANY]);
    await Promise.all([first, second]);

    expect(customersApi.listCompanies).toHaveBeenCalledTimes(1);
  });
});

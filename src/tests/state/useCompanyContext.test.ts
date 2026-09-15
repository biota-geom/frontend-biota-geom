import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Company } from '../../features/companies/types';
import { ApiError } from '../../services/api/apiError';

vi.mock('../../services/api/companiesApi', () => ({
  getCompanyById: vi.fn(),
}));

const companiesApi = await import('../../services/api/companiesApi');
const { useCompanyContext } =
  await import('../../features/companies/useCompanyContext');

const COMPANY: Company = {
  id: 'customer-1',
  name: 'Unidade Industrial Ouro Preto',
  status: 'active',
  segment: 'Mineração',
  location: 'Ouro Preto - MG',
};

beforeEach(() => {
  vi.resetAllMocks();
  useCompanyContext.getState().clearCompany();
});

describe('useCompanyContext store', () => {
  it('loadCompany() stores the company fetched for the route id', async () => {
    vi.mocked(companiesApi.getCompanyById).mockResolvedValue(COMPANY);

    await useCompanyContext.getState().loadCompany('customer-1');

    expect(companiesApi.getCompanyById).toHaveBeenCalledWith('customer-1');
    expect(useCompanyContext.getState().company).toEqual(COMPANY);
    expect(useCompanyContext.getState().status).toBe('success');
  });

  it('loadCompany() marks an unknown id as not found and keeps no company', async () => {
    vi.mocked(companiesApi.getCompanyById).mockRejectedValue(
      new ApiError(404, 'Empresa não encontrada')
    );

    await useCompanyContext.getState().loadCompany('empresa-desconhecida');

    expect(useCompanyContext.getState().company).toBeNull();
    expect(useCompanyContext.getState().status).toBe('error');
  });

  it('drops a resolved response once another company owns the context', async () => {
    let resolveFirst!: (company: Company) => void;
    vi.mocked(companiesApi.getCompanyById).mockReturnValueOnce(
      new Promise<Company>((resolve) => {
        resolveFirst = resolve;
      })
    );

    const stale = useCompanyContext.getState().loadCompany('customer-1');

    vi.mocked(companiesApi.getCompanyById).mockResolvedValueOnce({
      ...COMPANY,
      id: 'customer-2',
      name: 'Complexo Minerário Carajás',
    });
    await useCompanyContext.getState().loadCompany('customer-2');

    resolveFirst(COMPANY);
    await stale;

    expect(useCompanyContext.getState().company?.id).toBe('customer-2');
    expect(useCompanyContext.getState().status).toBe('success');
  });

  it('drops a rejected response once the context has been cleared', async () => {
    let rejectFirst!: (error: unknown) => void;
    vi.mocked(companiesApi.getCompanyById).mockReturnValueOnce(
      new Promise<Company>((_, reject) => {
        rejectFirst = reject;
      })
    );

    const stale = useCompanyContext.getState().loadCompany('customer-1');
    useCompanyContext.getState().clearCompany();

    rejectFirst(new ApiError(404, 'Empresa não encontrada'));
    await stale;

    // Sem o guarda, a rota seguinte herdaria um "não encontrada" de uma
    // requisição que já não pertence a ela
    expect(useCompanyContext.getState().status).toBe('idle');
    expect(useCompanyContext.getState().company).toBeNull();
  });

  it('clearCompany() resets the scope so a stale name cannot leak to the header', async () => {
    vi.mocked(companiesApi.getCompanyById).mockResolvedValue(COMPANY);
    await useCompanyContext.getState().loadCompany('customer-1');

    useCompanyContext.getState().clearCompany();

    expect(useCompanyContext.getState().company).toBeNull();
    expect(useCompanyContext.getState().status).toBe('idle');
    expect(useCompanyContext.getState().requestedCompanyId).toBeNull();
  });
});

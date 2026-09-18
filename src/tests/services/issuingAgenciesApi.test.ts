import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { listIssuingAgencies } =
  await import('../../services/api/issuingAgenciesApi');

describe('issuingAgenciesApi', () => {
  it('listIssuingAgencies() fetches /issuing-agencies and maps to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue([
      { id: 'agency-1', name: 'FEPAM', acronym: 'FEPAM' },
      { id: 'agency-2', name: 'IBAMA', acronym: null },
    ]);

    const agencies = await listIssuingAgencies();

    expect(request).toHaveBeenCalledWith('/issuing-agencies');
    expect(agencies).toEqual([
      { id: 'agency-1', name: 'FEPAM', acronym: 'FEPAM' },
      { id: 'agency-2', name: 'IBAMA', acronym: null },
    ]);
  });
});

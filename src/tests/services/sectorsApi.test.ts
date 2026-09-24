import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const { listSectors } = await import('../../services/api/sectorsApi');

describe('sectorsApi', () => {
  it('listSectors() fetches /sectors and maps the wire shape to the domain shape', async () => {
    vi.mocked(request).mockResolvedValue([
      {
        id: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
        name: 'Siderurgia',
        description: 'Processamento e transformação de metais.',
      },
      {
        id: '01a0a21c-fd47-73b9-8ce6-226acac99583',
        name: 'Saneamento',
        description: null,
      },
    ]);

    const sectors = await listSectors();

    expect(request).toHaveBeenCalledWith('/api/sectors');
    expect(sectors).toEqual([
      {
        id: '01a0a21c-fd40-762b-a1a9-744bd7cf47ee',
        name: 'Siderurgia',
        description: 'Processamento e transformação de metais.',
      },
      {
        id: '01a0a21c-fd47-73b9-8ce6-226acac99583',
        name: 'Saneamento',
        description: null,
      },
    ]);
  });

  it('listSectors() returns an empty list when the catalog is empty', async () => {
    vi.mocked(request).mockResolvedValue([]);

    await expect(listSectors()).resolves.toEqual([]);
  });
});

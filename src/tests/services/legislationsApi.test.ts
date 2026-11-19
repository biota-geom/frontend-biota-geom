import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MOCK_LICENSE_LEGISLATIONS } from '../../features/legislation/legislations.mock';

vi.mock('../../services/api/http', () => ({
  request: vi.fn(),
}));

const { request } = await import('../../services/api/http');
const {
  addLicenseLegislation,
  createLicenseLegislationsBatch,
  getLicenseLegislations,
  removeLicenseLegislation,
  searchLegislationCatalog,
  updateLicenseLegislation,
} = await import('../../services/api/legislationsApi');

const ACT = {
  type: 'LEI' as const,
  number: '12.305',
  year: 2010,
  issuingBody: 'Governo Federal',
  summary: 'Institui a PNRS.',
};

const ACT_WIRE = {
  type: 'LEI',
  number: '12.305',
  year: 2010,
  issuing_body: 'Governo Federal',
  summary: 'Institui a PNRS.',
};

describe('legislationsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLicenseLegislations() fetches the radar and maps it to camelCase', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS);

    const radar = await getLicenseLegislations('license-1');

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations'
    );
    expect(radar).toHaveLength(MOCK_LICENSE_LEGISLATIONS.length);
    expect(radar[0]).toEqual({
      id: '0198f5a1-0000-7000-8000-000000000001',
      legislation: {
        id: '0198f5a0-0000-7000-8000-000000000001',
        type: 'LEI',
        number: '12.305',
        year: 2010,
        issuingBody: 'Governo Federal',
        summary: 'Institui a Política Nacional de Resíduos Sólidos.',
      },
      source: 'SCAN',
      citedExcerpt: '…conforme a Lei nº 12.305/2010…',
      impact: 'HIGH',
      technicalAnalysis: null,
      readAt: null,
      createdAt: '2026-11-02T12:00:00.000Z',
    });
    expect(radar[1].readAt).toBe('2026-11-02T15:30:00.000Z');
    expect(radar[2].technicalAnalysis).toBe(
      MOCK_LICENSE_LEGISLATIONS[2].technical_analysis
    );
  });

  it('getLicenseLegislations() keeps the order the backend returns', async () => {
    vi.mocked(request).mockResolvedValue(
      [...MOCK_LICENSE_LEGISLATIONS].reverse()
    );

    const radar = await getLicenseLegislations('license-1');

    expect(radar.map((item) => item.legislation.year)).toEqual([
      1998, 1997, 2010,
    ]);
  });

  it('getLicenseLegislations() filters by impact on the server', async () => {
    vi.mocked(request).mockResolvedValue([]);

    await getLicenseLegislations('license-1', { impact: 'HIGH' });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations?impact=HIGH'
    );
  });

  it('updateLicenseLegislation() PATCHes the entry and maps the answer', async () => {
    vi.mocked(request).mockResolvedValue({
      ...MOCK_LICENSE_LEGISLATIONS[0],
      impact: 'LOW',
      read_at: '2026-11-12T15:00:00.000Z',
    });

    const updated = await updateLicenseLegislation('license-1', 'link-1', {
      impact: 'LOW',
      read: true,
    });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'PATCH', body: { impact: 'LOW', read: true } }
    );
    expect(updated.impact).toBe('LOW');
    expect(updated.readAt).toBe('2026-11-12T15:00:00.000Z');
    expect(updated.legislation.issuingBody).toBe('Governo Federal');
  });

  it('updateLicenseLegislation() sends null to clear the impact', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS[1]);

    await updateLicenseLegislation('license-1', 'link-1', { impact: null });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'PATCH', body: { impact: null } }
    );
  });

  it('addLicenseLegislation() posts the act data and maps the new entry', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS[2]);

    const created = await addLicenseLegislation('license-1', {
      legislation: ACT,
      citedExcerpt: null,
    });

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations',
      {
        method: 'POST',
        body: { legislation: ACT_WIRE, cited_excerpt: null },
      }
    );
    expect(created.id).toBe(MOCK_LICENSE_LEGISLATIONS[2].id);
    expect(created.legislation.issuingBody).toBe(
      MOCK_LICENSE_LEGISLATIONS[2].legislation.issuing_body
    );
  });

  it('searchLegislationCatalog() searches and maps catalog acts', async () => {
    vi.mocked(request).mockResolvedValue([
      MOCK_LICENSE_LEGISLATIONS[0].legislation,
    ]);

    const result = await searchLegislationCatalog('12.305');

    expect(request).toHaveBeenCalledWith('/api/legislations?search=12.305');
    expect(result[0].number).toBe('12.305');
  });

  it('searchLegislationCatalog() accepts a data envelope', async () => {
    vi.mocked(request).mockResolvedValue({
      data: [MOCK_LICENSE_LEGISLATIONS[0].legislation],
    });

    const result = await searchLegislationCatalog('12.305');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(MOCK_LICENSE_LEGISLATIONS[0].legislation.id);
  });

  it('searchLegislationCatalog() preserves up to 10 returned acts', async () => {
    vi.mocked(request).mockResolvedValue(
      Array.from({ length: 10 }, (_, index) => ({
        ...MOCK_LICENSE_LEGISLATIONS[0].legislation,
        id: `legislation-${index + 1}`,
        number: String(index + 1),
      }))
    );

    const result = await searchLegislationCatalog('lei');

    expect(result).toHaveLength(10);
    expect(result[9].id).toBe('legislation-10');
  });

  it('createLicenseLegislationsBatch() posts catalog and manual acts', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS);

    await createLicenseLegislationsBatch('license-1', [
      {
        legislationId: 'legislation-1',
        citedExcerpt: null,
        source: 'MANUAL',
      },
      {
        legislation: ACT,
        citedExcerpt: 'art. 3º',
        source: 'SCAN',
        impact: 'MODERATE',
      },
    ]);

    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/batch',
      {
        method: 'POST',
        body: {
          legislations: [
            {
              legislation_id: 'legislation-1',
              cited_excerpt: null,
              source: 'MANUAL',
            },
            {
              legislation: ACT_WIRE,
              cited_excerpt: 'art. 3º',
              source: 'SCAN',
              impact: 'MODERATE',
            },
          ],
        },
      }
    );
  });

  it('updateLicenseLegislation() patches the excerpt and, when given, the act', async () => {
    vi.mocked(request).mockResolvedValue(MOCK_LICENSE_LEGISLATIONS[0]);

    await updateLicenseLegislation('license-1', 'link-1', {
      citedExcerpt: 'art. 3º',
    });
    expect(request).toHaveBeenLastCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'PATCH', body: { cited_excerpt: 'art. 3º' } }
    );

    const updated = await updateLicenseLegislation('license-1', 'link-1', {
      citedExcerpt: null,
      legislation: ACT,
    });
    expect(request).toHaveBeenLastCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      {
        method: 'PATCH',
        body: { cited_excerpt: null, legislation: ACT_WIRE },
      }
    );
    expect(updated.id).toBe(MOCK_LICENSE_LEGISLATIONS[0].id);
  });

  it('removeLicenseLegislation() deletes the radar entry', async () => {
    vi.mocked(request).mockResolvedValue(undefined);

    await expect(
      removeLicenseLegislation('license-1', 'link-1')
    ).resolves.toBeUndefined();
    expect(request).toHaveBeenCalledWith(
      '/api/licenses/license-1/legislations/link-1',
      { method: 'DELETE' }
    );
  });
});

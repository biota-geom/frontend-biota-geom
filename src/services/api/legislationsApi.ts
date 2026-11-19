import type {
  LegislationImpact,
  LegislationInput,
  LicenseLegislation,
} from '../../features/legislation/types';
import { request } from './http';
import type {
  BatchLicenseLegislationRequestWire,
  AddLicenseLegislationRequestWire,
  LegislationInputWire,
  LegislationWire,
  LicenseLegislationWire,
  UpdateLicenseLegislationRequestWire,
} from './types';

export async function searchLegislationCatalog(
  search: string
): Promise<import('../../features/legislation/types').Legislation[]> {
  const query = encodeURIComponent(search.trim());
  const response = await request<
    | LegislationWire[]
    | {
        data?: LegislationWire[];
        legislations?: LegislationWire[];
        results?: LegislationWire[];
        items?: LegislationWire[];
      }
  >(`/api/legislations?search=${query}`);

  const wire = ((): LegislationWire[] => {
    if (Array.isArray(response)) return response;

    for (const key of ['data', 'legislations', 'results', 'items'] as const) {
      const value = response[key];
      if (Array.isArray(value)) return value;
    }

    return [];
  })();

  return wire.slice(0, 10).map((item) => {
    const catalogItem = item as LegislationWire & {
      issuingBody?: string;
    };
    return {
      id: catalogItem.id,
      type: catalogItem.type,
      number: catalogItem.number,
      year: catalogItem.year,
      issuingBody: catalogItem.issuing_body ?? catalogItem.issuingBody ?? '',
      summary: catalogItem.summary,
    };
  });
}

export function toLicenseLegislation(
  wire: LicenseLegislationWire
): LicenseLegislation {
  return {
    id: wire.id,
    legislation: {
      id: wire.legislation.id,
      type: wire.legislation.type,
      number: wire.legislation.number,
      year: wire.legislation.year,
      issuingBody: wire.legislation.issuing_body,
      summary: wire.legislation.summary,
    },
    source: wire.source,
    citedExcerpt: wire.cited_excerpt,
    impact: wire.impact,
    technicalAnalysis: wire.technical_analysis,
    readAt: wire.read_at,
    createdAt: wire.created_at,
  };
}

export interface LicenseLegislationFilter {
  impact?: LegislationImpact;
}

/** What the radar's PATCH accepts; send only the fields being changed. */
export interface LicenseLegislationUpdate {
  /** `null` clears the classification. */
  impact?: LegislationImpact | null;
  /** The backend only accepts `true`: an entry can't go back to unread. */
  read?: true;
  citedExcerpt?: string | null;
  /** Only editable while no other license cites the act (409 otherwise). */
  legislation?: LegislationInput;
}

/**
 * The license radar, most recent legislation first (ordered by the backend).
 * `filter.impact` narrows it to one impact level.
 */
export async function getLicenseLegislations(
  licenseId: string,
  filter: LicenseLegislationFilter = {}
): Promise<LicenseLegislation[]> {
  const query = filter.impact ? `?impact=${filter.impact}` : '';
  const wire = await request<LicenseLegislationWire[]>(
    `/api/licenses/${licenseId}/legislations${query}`
  );

  return wire.map(toLicenseLegislation);
}

function toLegislationInputWire(input: LegislationInput): LegislationInputWire {
  return {
    type: input.type,
    number: input.number,
    year: input.year,
    issuing_body: input.issuingBody,
    summary: input.summary,
  };
}

/**
 * Registers an act on the radar by hand. The backend reuses the catalog act
 * when one with the same identity already exists, and answers 409 when the
 * license already cites it.
 */
export async function addLicenseLegislation(
  licenseId: string,
  input:
    | { legislation: LegislationInput; citedExcerpt: string | null }
    | { legislationId: string; citedExcerpt: string | null }
): Promise<LicenseLegislation> {
  const body: AddLicenseLegislationRequestWire =
    'legislationId' in input
      ? {
          legislation_id: input.legislationId,
          cited_excerpt: input.citedExcerpt,
        }
      : {
          legislation: toLegislationInputWire(input.legislation),
          cited_excerpt: input.citedExcerpt,
        };
  const wire = await request<LicenseLegislationWire>(
    `/api/licenses/${licenseId}/legislations`,
    { method: 'POST', body }
  );

  return toLicenseLegislation(wire);
}

export interface BatchLicenseLegislationInput {
  legislationId?: string;
  legislation?: LegislationInput;
  citedExcerpt?: string | null;
  source: 'MANUAL' | 'SCAN';
  impact?: LegislationImpact | null;
}

export async function createLicenseLegislationsBatch(
  licenseId: string,
  legislations: BatchLicenseLegislationInput[]
): Promise<LicenseLegislation[]> {
  const body: BatchLicenseLegislationRequestWire = {
    legislations: legislations.map((item) => {
      const common = {
        cited_excerpt: item.citedExcerpt ?? null,
        source: item.source,
        ...(item.impact ? { impact: item.impact } : {}),
      };
      return item.legislationId
        ? { ...common, legislation_id: item.legislationId }
        : {
            ...common,
            legislation: toLegislationInputWire(
              item.legislation as LegislationInput
            ),
          };
    }),
  };
  const wire = await request<LicenseLegislationWire[]>(
    `/api/licenses/${licenseId}/legislations/batch`,
    { method: 'POST', body }
  );
  return wire.map(toLicenseLegislation);
}

/**
 * Updates a radar entry: classifies its impact, marks it as read, edits the
 * cited excerpt, and/or updates the manual legislation act data.
 */
export async function updateLicenseLegislation(
  licenseId: string,
  licenseLegislationId: string,
  input: LicenseLegislationUpdate
): Promise<LicenseLegislation> {
  const body: UpdateLicenseLegislationRequestWire = {
    ...(input.citedExcerpt !== undefined
      ? { cited_excerpt: input.citedExcerpt }
      : {}),
    ...(input.legislation
      ? { legislation: toLegislationInputWire(input.legislation) }
      : {}),
    ...(input.impact !== undefined ? { impact: input.impact } : {}),
    ...(input.read !== undefined ? { read: input.read } : {}),
  };
  const wire = await request<LicenseLegislationWire>(
    `/api/licenses/${licenseId}/legislations/${licenseLegislationId}`,
    { method: 'PATCH', body }
  );

  return toLicenseLegislation(wire);
}

/** Takes the act off this license's radar only; the catalog keeps it. */
export async function removeLicenseLegislation(
  licenseId: string,
  licenseLegislationId: string
): Promise<void> {
  await request<void>(
    `/api/licenses/${licenseId}/legislations/${licenseLegislationId}`,
    { method: 'DELETE' }
  );
}

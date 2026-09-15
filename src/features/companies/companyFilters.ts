import type { Company } from './types';

/**
 * Sentinel used by both dropdowns for their "Todos" option. It cannot collide
 * with a real segment name, which is always a non-empty label from the API.
 */
// Stryker disable next-line all: the sentinel's own value is arbitrary — every comparison goes through this constant, so another string behaves identically (see README)
export const ALL_FILTER_VALUE = '';

export type CompanyStatusFilter = typeof ALL_FILTER_VALUE | Company['status'];

export interface CompanyFilterValues {
  search: string;
  /** Segment name as served by the API, or `ALL_FILTER_VALUE`. */
  segment: string;
  status: CompanyStatusFilter;
}

export const EMPTY_COMPANY_FILTERS: CompanyFilterValues = {
  search: '',
  segment: ALL_FILTER_VALUE,
  status: ALL_FILTER_VALUE,
};

/**
 * Folds a string into the form both sides of a search comparison use:
 * lowercase and without diacritics, so "Goiania" matches "Goiânia". NFD splits
 * an accented character into base letter + combining mark, and the mark is the
 * part dropped.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Segment options are derived from the loaded listing instead of a hardcoded
 * catalog: the set of segments is data, and it changes as companies are
 * registered.
 */
export function listSegmentOptions(companies: Company[]): string[] {
  const segments = new Set<string>();

  for (const company of companies) {
    const segment = company.segment.trim();
    if (segment !== '') segments.add(segment);
  }

  return [...segments].sort((first, second) =>
    first.localeCompare(second, 'pt-BR')
  );
}

/**
 * Applies search, segment and status together (logical AND).
 *
 * The backend exposes no search endpoint, so this runs client-side over the
 * already loaded listing — adequate for the MVP's data volume; revisit when
 * the listing gains server-side pagination.
 */
export function filterCompanies(
  companies: Company[],
  { search, segment, status }: CompanyFilterValues
): Company[] {
  const query = normalizeSearchText(search);

  return companies.filter((company) => {
    if (status !== ALL_FILTER_VALUE && company.status !== status) {
      return false;
    }

    if (segment !== ALL_FILTER_VALUE && company.segment !== segment) {
      return false;
    }

    // `location` arrives from the API as "Cidade - UF", so matching it covers
    // both the city and the state the acceptance criteria ask for.
    return [company.name, company.segment, company.location].some((field) =>
      normalizeSearchText(field).includes(query)
    );
  });
}

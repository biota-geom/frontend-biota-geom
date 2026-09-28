import type { LicensePanelItem } from './types';

/**
 * Sentinel used by the issuing-agency dropdown for its "Todos" option. It
 * cannot collide with a real agency name, which is always a non-empty label
 * from the API.
 */
export const ALL_AGENCIES_VALUE = '';

export interface LicenseFilterValues {
  search: string;
  /** Issuing agency name as served by the API, or ALL_AGENCIES_VALUE. */
  agency: string;
}

export const EMPTY_LICENSE_FILTERS: LicenseFilterValues = {
  search: '',
  agency: ALL_AGENCIES_VALUE,
};

/**
 * Folds a string into the form both sides of a search comparison use:
 * lowercase and without diacritics, so "orgao" matches "Órgão".
 */
function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

/**
 * Agency options are derived from the loaded panel instead of a hardcoded
 * catalog: the set of agencies is data, and it changes as licenses are
 * registered.
 */
export function listAgencyOptions(licenses: LicensePanelItem[]): string[] {
  const agencies = new Set<string>();

  for (const license of licenses) {
    if (license.issuingAgency) agencies.add(license.issuingAgency);
  }

  return [...agencies].sort((first, second) =>
    first.localeCompare(second, 'pt-BR')
  );
}

/**
 * Applies the agency filter and the free-text search (over type, process
 * number and issuing agency) together, logical AND — mirroring
 * companyFilters.filterCompanies.
 *
 * Runs client-side over the already loaded panel: the backend exposes no
 * search endpoint, and a single company's licenses are few enough that there
 * is nothing to debounce.
 */
export function filterLicenses(
  licenses: LicensePanelItem[],
  { search, agency }: LicenseFilterValues
): LicensePanelItem[] {
  const query = normalizeSearchText(search);

  return licenses.filter((license) => {
    if (agency !== ALL_AGENCIES_VALUE && license.issuingAgency !== agency) {
      return false;
    }

    return [
      license.type,
      license.processNumber,
      license.issuingAgency ?? '',
    ].some((field) => normalizeSearchText(field).includes(query));
  });
}

import { describe, expect, it } from 'vitest';
import {
  ALL_AGENCIES_VALUE,
  EMPTY_LICENSE_FILTERS,
  filterLicenses,
  listAgencyOptions,
} from '../../features/licenses/licenseFilters';
import type { LicensePanelItem } from '../../features/licenses/types';

const LICENSES: LicensePanelItem[] = [
  {
    id: 'license-1',
    type: 'Licença Prévia (LP)',
    processNumber: 'LP nº 482/2024',
    issuingAgency: 'FEPAM',
    issueDate: '2024-03-12T00:00:00.000Z',
    expirationDate: '2026-03-12T00:00:00.000Z',
    status: 'Regular',
  },
  {
    id: 'license-2',
    type: 'Licença de Operação (LO)',
    processNumber: 'LO nº 118/2020',
    issuingAgency: 'FEPAM',
    issueDate: '2020-01-10T00:00:00.000Z',
    expirationDate: '2025-01-10T00:00:00.000Z',
    status: 'Vencida',
  },
  {
    id: 'license-3',
    type: 'Outorga de Captação de Água',
    processNumber: 'OUT nº 085/2021',
    issuingAgency: 'SIOUT',
    issueDate: '2021-08-22T00:00:00.000Z',
    expirationDate: '2026-08-22T00:00:00.000Z',
    status: 'Atenção',
  },
];

function filterIds(search = '', agency = ALL_AGENCIES_VALUE) {
  return filterLicenses(LICENSES, { search, agency }).map(
    (license) => license.id
  );
}

describe('listAgencyOptions', () => {
  it('derives the agencies from the loaded panel, sorted and deduplicated', () => {
    expect(listAgencyOptions(LICENSES)).toEqual(['FEPAM', 'SIOUT']);
  });

  it('skips licenses without an issuing agency', () => {
    const withoutAgency: LicensePanelItem[] = [
      { ...LICENSES[0], issuingAgency: null },
    ];

    expect(listAgencyOptions(withoutAgency)).toEqual([]);
  });

  it('returns an empty list when there are no licenses', () => {
    expect(listAgencyOptions([])).toEqual([]);
  });
});

describe('filterLicenses', () => {
  it('returns every license when no filter is applied', () => {
    expect(filterLicenses(LICENSES, EMPTY_LICENSE_FILTERS)).toHaveLength(3);
  });

  it('matches the process number', () => {
    expect(filterIds('118/2020')).toEqual(['license-2']);
  });

  it('matches the type', () => {
    expect(filterIds('outorga')).toEqual(['license-3']);
  });

  it('matches the issuing agency', () => {
    expect(filterIds('siout')).toEqual(['license-3']);
  });

  it('ignores case and diacritics on both sides of the comparison', () => {
    expect(filterIds('LICENCA PREVIA')).toEqual(['license-1']);
  });

  it('filters by issuing agency', () => {
    expect(filterIds('', 'FEPAM')).toEqual(['license-1', 'license-2']);
  });

  it('combines search and agency with a logical AND', () => {
    expect(filterIds('118/2020', 'FEPAM')).toEqual(['license-2']);
    expect(filterIds('118/2020', 'SIOUT')).toEqual([]);
  });

  it('returns no license when nothing matches the search', () => {
    expect(filterIds('processo inexistente')).toEqual([]);
  });
});

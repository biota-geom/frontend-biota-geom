import { describe, expect, it } from 'vitest';
import {
  ALL_FILTER_VALUE,
  type CompanyStatusFilter,
  EMPTY_COMPANY_FILTERS,
  filterCompanies,
  listSegmentOptions,
  normalizeSearchText,
} from '../../features/companies/companyFilters';
import type { Company } from '../../features/companies/types';

const COMPANIES: Company[] = [
  {
    id: 'customer-1',
    name: 'Unidade Industrial RS',
    status: 'active',
    segment: 'Siderurgia',
    location: 'Porto Alegre - RS',
  },
  {
    id: 'customer-2',
    name: 'Fábrica São Paulo',
    status: 'active',
    segment: 'Metalúrgica',
    location: 'Sorocaba - SP',
  },
  {
    id: 'customer-3',
    name: 'Agro Centro-Oeste',
    status: 'inactive',
    segment: 'Agronegócio',
    location: 'Sorriso - MT',
  },
  {
    id: 'customer-4',
    name: 'Mineradora Goiânia',
    status: 'inactive',
    segment: 'Mineração',
    location: 'Goiânia - GO',
  },
];

function filterNames(
  search = '',
  segment: string = ALL_FILTER_VALUE,
  status: CompanyStatusFilter = ALL_FILTER_VALUE
) {
  return filterCompanies(COMPANIES, { search, segment, status }).map(
    (company) => company.name
  );
}

describe('normalizeSearchText', () => {
  it.each([
    { value: 'Goiânia', expected: 'goiania' },
    { value: 'MINERAÇÃO', expected: 'mineracao' },
    { value: '  Fábrica  ', expected: 'fabrica' },
    { value: 'Sorocaba - SP', expected: 'sorocaba - sp' },
  ])('folds "$value" into "$expected"', ({ value, expected }) => {
    expect(normalizeSearchText(value)).toBe(expected);
  });
});

describe('listSegmentOptions', () => {
  it('derives the segments from the loaded listing, sorted and deduplicated', () => {
    expect(listSegmentOptions(COMPANIES)).toEqual([
      'Agronegócio',
      'Metalúrgica',
      'Mineração',
      'Siderurgia',
    ]);
  });

  it('deduplicates repeated segments', () => {
    const repeated: Company[] = [
      COMPANIES[0],
      { ...COMPANIES[0], id: 'customer-5' },
    ];

    expect(listSegmentOptions(repeated)).toEqual(['Siderurgia']);
  });

  it('skips companies without a segment', () => {
    const withBlank: Company[] = [
      COMPANIES[0],
      { ...COMPANIES[1], segment: '   ' },
    ];

    expect(listSegmentOptions(withBlank)).toEqual(['Siderurgia']);
  });

  it('returns an empty list when there are no companies', () => {
    expect(listSegmentOptions([])).toEqual([]);
  });
});

describe('filterCompanies', () => {
  it('returns every company when no filter is applied', () => {
    expect(filterCompanies(COMPANIES, EMPTY_COMPANY_FILTERS)).toHaveLength(4);
  });

  it('matches the company name', () => {
    expect(filterNames('unidade')).toEqual(['Unidade Industrial RS']);
  });

  it('matches the segment', () => {
    expect(filterNames('siderurgia')).toEqual(['Unidade Industrial RS']);
  });

  it('matches the city inside the location', () => {
    expect(filterNames('sorocaba')).toEqual(['Fábrica São Paulo']);
  });

  it('matches the state inside the location', () => {
    expect(filterNames('mt')).toEqual(['Agro Centro-Oeste']);
  });

  it('ignores case and diacritics on both sides of the comparison', () => {
    expect(filterNames('GOIANIA')).toEqual(['Mineradora Goiânia']);
    expect(filterNames('fabrica')).toEqual(['Fábrica São Paulo']);
    expect(filterNames('mineração')).toEqual(['Mineradora Goiânia']);
  });

  it('ignores surrounding whitespace in the query', () => {
    expect(filterNames('   unidade   ')).toEqual(['Unidade Industrial RS']);
  });

  it('filters by segment', () => {
    expect(filterNames('', 'Agronegócio')).toEqual(['Agro Centro-Oeste']);
  });

  it('filters by status', () => {
    expect(filterNames('', ALL_FILTER_VALUE, 'active')).toEqual([
      'Unidade Industrial RS',
      'Fábrica São Paulo',
    ]);
    expect(filterNames('', ALL_FILTER_VALUE, 'inactive')).toEqual([
      'Agro Centro-Oeste',
      'Mineradora Goiânia',
    ]);
  });

  it('combines search, segment and status with a logical AND', () => {
    expect(filterNames('sorocaba', 'Metalúrgica', 'active')).toEqual([
      'Fábrica São Paulo',
    ]);
    expect(filterNames('sorocaba', 'Metalúrgica', 'inactive')).toEqual([]);
    expect(filterNames('sorocaba', 'Mineração', 'active')).toEqual([]);
    expect(filterNames('goiania', 'Metalúrgica', ALL_FILTER_VALUE)).toEqual([]);
  });

  it('returns no company when nothing matches the search', () => {
    expect(filterNames('empresa inexistente')).toEqual([]);
  });
});

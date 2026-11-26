import { describe, expect, it } from 'vitest';
import {
  alignDashboardWithLicenses,
  getCriticalLicenses,
  isArchivedLicenseStatus,
  summarizeLicenses,
} from '../../features/licenses/licenseSummary';
import type {
  LicenseDashboard,
  LicensePanelItem,
} from '../../features/licenses/types';

function makeLicense(
  overrides: Partial<LicensePanelItem> & { id: string; status: string }
): LicensePanelItem {
  return {
    type: 'Licença de Operação (LO)',
    processNumber: `LO ${overrides.id}`,
    issuingAgency: 'FEPAM',
    issueDate: '2024-01-01T00:00:00.000Z',
    expirationDate: '2026-12-31T00:00:00.000Z',
    documentUrl: null,
    ...overrides,
  };
}

describe('licenseSummary', () => {
  it('recognizes archived licenses in both PT-BR label and raw enum forms', () => {
    expect(isArchivedLicenseStatus('Renovada/Arquivada')).toBe(true);
    expect(isArchivedLicenseStatus('ARCHIVED')).toBe(true);
    expect(isArchivedLicenseStatus('Regular')).toBe(false);
  });

  it('counts active licenses by normalized status and ignores archived ones', () => {
    const summary = summarizeLicenses([
      { status: 'Regular' },
      { status: 'REGULAR' },
      { status: 'Atenção' },
      { status: 'ATTENTION' },
      { status: 'Vencida' },
      { status: 'EXPIRED' },
      { status: 'Renovada/Arquivada' },
      { status: 'ARCHIVED' },
    ]);

    expect(summary).toEqual({
      total: 6,
      regular: 2,
      attention: 2,
      expired: 2,
    });
  });

  it('orders critical licenses with expired first, then attention, by earliest expiration', () => {
    const critical = getCriticalLicenses([
      makeLicense({
        id: 'regular',
        status: 'Regular',
        expirationDate: '2025-01-01T00:00:00.000Z',
      }),
      makeLicense({
        id: 'archived',
        status: 'ARCHIVED',
        expirationDate: '2024-01-01T00:00:00.000Z',
      }),
      makeLicense({
        id: 'attention-late',
        status: 'ATTENTION',
        expirationDate: '2026-11-15T00:00:00.000Z',
      }),
      makeLicense({
        id: 'attention-early',
        status: 'Atenção',
        expirationDate: '2026-10-15T00:00:00.000Z',
      }),
      makeLicense({
        id: 'expired-late',
        status: 'Vencida',
        expirationDate: '2026-06-01T00:00:00.000Z',
      }),
      makeLicense({
        id: 'expired-early',
        status: 'EXPIRED',
        expirationDate: '2025-05-01T00:00:00.000Z',
      }),
    ]);

    expect(
      critical.map((item) => ({ id: item.id, status: item.status }))
    ).toEqual([
      { id: 'expired-early', status: 'Vencida' },
      { id: 'expired-late', status: 'Vencida' },
      { id: 'attention-early', status: 'Atenção' },
      { id: 'attention-late', status: 'Atenção' },
    ]);
  });

  it('aligns dashboard totals, status counts and critical items with the licenses list while keeping pendingItems', () => {
    const outOfSyncDashboard: LicenseDashboard = {
      header: { activeLicenses: 9, pendingItems: 5 },
      counts: { regular: 4, attention: 3, expired: 2 },
      critical: [
        {
          id: 'archived',
          type: 'LO',
          processNumber: 'LO archived',
          expirationDate: '2024-01-01T00:00:00.000Z',
          status: 'Vencida',
        },
      ],
    };

    const aligned = alignDashboardWithLicenses(outOfSyncDashboard, [
      makeLicense({ id: 'reg-1', status: 'Regular' }),
      makeLicense({
        id: 'att-1',
        status: 'Atenção',
        expirationDate: '2026-10-01T00:00:00.000Z',
      }),
      makeLicense({ id: 'archived', status: 'Renovada/Arquivada' }),
    ]);

    expect(aligned).toEqual({
      header: { activeLicenses: 2, pendingItems: 5 },
      counts: { regular: 1, attention: 1, expired: 0 },
      critical: [
        {
          id: 'att-1',
          type: 'Licença de Operação (LO)',
          processNumber: 'LO att-1',
          expirationDate: '2026-10-01T00:00:00.000Z',
          status: 'Atenção',
        },
      ],
    });
  });
});

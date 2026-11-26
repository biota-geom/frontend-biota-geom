import { formatLicenseStatus } from './licenseDetailsFormatting';
import type {
  LicenseDashboard,
  LicenseDashboardCriticalItem,
  LicensePanelItem,
  LicenseSummary,
} from './types';

const ARCHIVED_STATUS = 'Renovada/Arquivada';

export function isArchivedLicenseStatus(status: string): boolean {
  return formatLicenseStatus(status) === ARCHIVED_STATUS;
}

/**
 * Counts active licenses (excluding Renovada/Arquivada) from the license rows
 * themselves so the Dashboard and the Licenses Panel always show identical
 * totals and status breakdowns.
 */
export function summarizeLicenses(
  licenses: ReadonlyArray<Pick<LicensePanelItem, 'status'>>
): LicenseSummary {
  let regular = 0;
  let attention = 0;
  let expired = 0;

  for (const license of licenses) {
    const status = formatLicenseStatus(license.status);
    if (status === ARCHIVED_STATUS) continue;
    if (status === 'Regular') regular += 1;
    else if (status === 'Atenção') attention += 1;
    else if (status === 'Vencida') expired += 1;
  }

  return {
    total: regular + attention + expired,
    regular,
    attention,
    expired,
  };
}

function getCriticalityOrder(status: string): number {
  if (status === 'Vencida') return 0;
  if (status === 'Atenção') return 1;
  return 2;
}

/**
 * Derives the critical licenses list (Vencida first, then Atenção, earliest
 * expiration first) from the same license rows shown in the Licenses Panel.
 */
export function getCriticalLicenses(
  licenses: ReadonlyArray<LicensePanelItem>
): LicenseDashboardCriticalItem[] {
  return licenses
    .map((license) => ({
      id: license.id,
      type: license.type,
      processNumber: license.processNumber,
      expirationDate: license.expirationDate,
      status: formatLicenseStatus(license.status),
    }))
    .filter(
      (license) => license.status === 'Vencida' || license.status === 'Atenção'
    )
    .sort((left, right) => {
      const orderDiff =
        getCriticalityOrder(left.status) - getCriticalityOrder(right.status);
      if (orderDiff !== 0) return orderDiff;
      return left.expirationDate.localeCompare(right.expirationDate);
    });
}

/**
 * Reconciles the dashboard license counts and critical list with the loaded
 * licenses panel list, keeping `pendingItems` from the dashboard endpoint.
 */
export function alignDashboardWithLicenses(
  dashboard: LicenseDashboard,
  licenses: ReadonlyArray<LicensePanelItem>
): LicenseDashboard {
  const summary = summarizeLicenses(licenses);

  return {
    header: {
      activeLicenses: summary.total,
      pendingItems: dashboard.header.pendingItems,
    },
    counts: {
      regular: summary.regular,
      attention: summary.attention,
      expired: summary.expired,
    },
    critical: getCriticalLicenses(licenses),
  };
}

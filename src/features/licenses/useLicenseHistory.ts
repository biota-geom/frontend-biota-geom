import { useEffect, useState } from 'react';
import { getLicenseHistory } from '../../services/api/licensesApi';
import type { LicenseVersion } from './types';

/*
 * The version history is secondary to the license itself, so a failure here
 * resolves to an empty list instead of an error state: the details page must
 * keep working without it.
 */
export function useLicenseHistory(licenseId: string | undefined) {
  const [versions, setVersions] = useState<LicenseVersion[]>([]);

  useEffect(() => {
    if (!licenseId) return;

    const safeLicenseId = licenseId;
    let isCurrent = true;

    async function loadHistory() {
      try {
        const result = await getLicenseHistory(safeLicenseId);
        if (isCurrent) setVersions(result);
      } catch {
        if (isCurrent) setVersions([]);
      }
    }

    void loadHistory();

    return () => {
      isCurrent = false;
    };
  }, [licenseId]);

  return { versions };
}

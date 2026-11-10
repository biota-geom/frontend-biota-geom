import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getLicenseLegislations } from '../../services/api/legislationsApi';
import type { LicenseLegislation } from './types';

type LicenseLegislationsStatus = 'idle' | 'loading' | 'success' | 'error';

/*
 * Loads a license's radar. Shared by every radar feature (listing, impact,
 * technical analysis): after changing an entry, call `refetch` to reload it.
 */
export function useLicenseLegislations(licenseId: string | undefined) {
  const [legislations, setLegislations] = useState<LicenseLegislation[]>([]);
  const [status, setStatus] = useState<LicenseLegislationsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (!licenseId) return;

    const safeLicenseId = licenseId;
    let isCurrent = true;

    async function loadLegislations() {
      setStatus('loading');
      setError(null);

      try {
        const result = await getLicenseLegislations(safeLicenseId);
        if (!isCurrent) return;

        setLegislations(result);
        setStatus('success');
      } catch (caught) {
        if (!isCurrent) return;

        setLegislations([]);
        setStatus('error');
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível carregar o radar de legislação.'
        );
      }
    }

    void loadLegislations();

    return () => {
      isCurrent = false;
    };
  }, [licenseId, reloadVersion]);

  return {
    legislations,
    error,
    refetch: () => setReloadVersion((version) => version + 1),
    status,
  };
}

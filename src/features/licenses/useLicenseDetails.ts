import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getLicenseDetails } from '../../services/api/licensesApi';
import type { LicenseDetails } from './types';

type LicenseDetailsStatus = 'idle' | 'loading' | 'success' | 'error';

export function useLicenseDetails(
  customerId: string | undefined,
  licenseId: string | undefined
) {
  const [details, setDetails] = useState<LicenseDetails | null>(null);
  const [status, setStatus] = useState<LicenseDetailsStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (!customerId || !licenseId) return;

    const safeCustomerId = customerId;
    const safeLicenseId = licenseId;
    let isCurrent = true;

    async function loadLicenseDetails() {
      setStatus('loading');
      setError(null);

      try {
        const result = await getLicenseDetails(safeCustomerId, safeLicenseId);
        if (!isCurrent) return;

        setDetails(result);
        setStatus('success');
      } catch (caught) {
        if (!isCurrent) return;

        setDetails(null);
        setStatus('error');
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível carregar os detalhes da licença.'
        );
      }
    }

    void loadLicenseDetails();

    return () => {
      isCurrent = false;
    };
  }, [customerId, licenseId, reloadVersion]);

  return {
    details,
    error,
    refetch: () => setReloadVersion((version) => version + 1),
    status,
  };
}

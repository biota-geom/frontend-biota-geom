import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getLicenseConditionsCompliance } from '../../services/api/licenseConditionsApi';
import type { LicenseConditionsCompliance } from './types';

export function useConditionsCompliance(customerId: string | undefined) {
  const [compliance, setCompliance] =
    useState<LicenseConditionsCompliance | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (!customerId) return;

    const safeCustomerId = customerId;
    let isCurrent = true;

    async function loadCompliance() {
      setError(null);

      try {
        const result = await getLicenseConditionsCompliance(safeCustomerId);
        if (!isCurrent) return;

        // The previous value stays on screen while reloading, so the bar
        // moves to the new percentage instead of blinking out.
        setCompliance(result);
      } catch (caught) {
        if (!isCurrent) return;

        setCompliance(null);
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível carregar a conformidade geral.'
        );
      }
    }

    void loadCompliance();

    return () => {
      isCurrent = false;
    };
  }, [customerId, reloadVersion]);

  return {
    compliance,
    error,
    refetch: () => setReloadVersion((version) => version + 1),
  };
}

import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { listLicenseConditions } from '../../services/api/licenseConditionsApi';
import type { LicenseCondition } from './types';

type ConditionsStatus = 'idle' | 'loading' | 'success' | 'error';

export function useConditions(customerId: string | undefined) {
  const [conditions, setConditions] = useState<LicenseCondition[]>([]);
  const [status, setStatus] = useState<ConditionsStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;

    const safeCustomerId = customerId;
    let isCurrent = true;

    async function loadConditions() {
      setStatus('loading');
      setError(null);

      try {
        const result = await listLicenseConditions(safeCustomerId);
        if (!isCurrent) return;

        setConditions(result);
        setStatus('success');
      } catch (caught) {
        if (!isCurrent) return;

        setConditions([]);
        setStatus('error');
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Não foi possível carregar as condicionantes.'
        );
      }
    }

    void loadConditions();

    return () => {
      isCurrent = false;
    };
  }, [customerId]);

  return { conditions, error, status };
}

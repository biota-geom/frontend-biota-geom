import { useCallback, useEffect, useState } from 'react';
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

  /*
   * In place, without re-sorting: the API orders the listing by risk and due
   * date, and reproducing that order here would be the same rule written
   * twice. An edited condition keeps its row and only its own contents — the
   * recalculated risk level included — change.
   */
  const replaceCondition = useCallback((updated: LicenseCondition) => {
    setConditions((current) =>
      current.map((condition) =>
        condition.id === updated.id ? updated : condition
      )
    );
  }, []);

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((current) =>
      current.filter((condition) => condition.id !== conditionId)
    );
  }, []);

  /** Puts the list back as it was when an optimistic removal is rejected. */
  const restoreConditions = useCallback((previous: LicenseCondition[]) => {
    setConditions(previous);
  }, []);

  return {
    conditions,
    error,
    status,
    replaceCondition,
    removeCondition,
    restoreConditions,
  };
}

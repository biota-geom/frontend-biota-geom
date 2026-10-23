import { useEffect, useState } from 'react';
import { ApiError } from '../../services/api/apiError';
import { getEsgIndicators } from '../../services/api/esgIndicatorsApi';
import { isValidMonth } from './esgIndicatorsValidation';
import type { EsgMonthlyIndicators } from './types';

export type EsgIndicatorsLoadStatus = 'idle' | 'loading' | 'success' | 'error';

const LOAD_ERROR_MESSAGE =
  'Não foi possível carregar os indicadores deste mês.';

type LoadResult = {
  key: string;
  indicators: EsgMonthlyIndicators | null;
  error: string | null;
};

/*
 * The result is tagged with the company/month it belongs to, and the status is
 * derived by comparing that tag with the current request. That way, the render
 * right after a month change reports "loading" instead of briefly showing the
 * previous month's values as if they were the new month's.
 */
export function useEsgIndicators(companyId: string | undefined, month: string) {
  const [result, setResult] = useState<LoadResult | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  const isEnabled = Boolean(companyId) && isValidMonth(month);
  const key = `${companyId}|${month}|${reloadVersion}`;

  useEffect(() => {
    if (!companyId || !isValidMonth(month)) return;

    let isCurrent = true;

    async function load(safeCompanyId: string) {
      try {
        const indicators = await getEsgIndicators(safeCompanyId, month);
        if (isCurrent) setResult({ key, indicators, error: null });
      } catch (caught) {
        if (!isCurrent) return;
        setResult({
          key,
          indicators: null,
          error:
            caught instanceof ApiError ? caught.message : LOAD_ERROR_MESSAGE,
        });
      }
    }

    void load(companyId);

    return () => {
      isCurrent = false;
    };
  }, [companyId, key, month]);

  const current = isEnabled && result?.key === key ? result : null;

  let status: EsgIndicatorsLoadStatus = 'idle';
  if (isEnabled) {
    status = current ? (current.error ? 'error' : 'success') : 'loading';
  }

  return {
    error: current?.error ?? null,
    indicators: current?.indicators ?? null,
    reload: () => setReloadVersion((version) => version + 1),
    status,
  };
}
